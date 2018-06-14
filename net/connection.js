const WebSocketClient = require('websocket').client;
const Builder = require('../request/builder');
const codec = require('../request/codec');


class Connection {

    constructor(url){
        this.socket = new WebSocketClient();;
        this.requestId = 0;
        this.requests = {};
        this.connecting = false;
        this.header = Buffer.from('C001BA5E1225EFFF0000000000000001', 'hex');

        if(url)
            this.connect(url);
    }

    connect(url) {
        if(this.connecting)
            throw new Error('Already connecting...');

        this.connecting = true;
        const self = this;

        this.waitForConnection = new Promise(((resolve, reject) => {
            self.socket.on('connect', (connection) => {
                self.connection = connection;

                console.log('connected!');

                connection.on('close', () => { console.log('closed!') });
                connection.on('error', (error) => { console.log('Connection error: ' + error) });
                connection.on('message', (data) => {
                    if(data.type != 'binary')
                        throw new Error('Wrong message format from server: ' + data.type);
                    console.log('Data: ' + data.binaryData.toString('hex'));
                    let header = data.binaryData.slice(0, 16);
                    if(Buffer.compare(header, this.header) != 0)
                        throw new Error('Wrong message header from server: ' + header.toString('hex'));
                    let body = data.binaryData.slice(16);
                    let response = codec.decode(body);
                    let requestId = response.getChild('MessageId').value;
                    let func = this.requests[requestId];
                    if(!func)
                        throw new Error('Unknown response MessageId: ' + requestId);
                    func(response);
                    delete this.requests[requestId];
                });

                this.connecting = false;
                resolve(connection);
            });

            self.socket.on('connectFailed', (error) => {
                console.log('connect error: ' + error);
                this.connecting = false;
                reject(error);
            });
        }));

        this.socket.connect(url);
        return this.waitForConnection;
    }

    modify(records, pk) {
        let builder = new Builder(records);
        let data = builder.buildModification(pk, ++this.requestId);
        let self = this;

        if(!this.connection || !this.connection.connected)
            throw new Error('Connection is not open!');

        this.connection.sendBytes(Buffer.concat([this.header, data]));

        return new Promise((resolve, reject) => {
            self.requests[self.requestId] = (response, error) => {
                if(response)
                    resolve(response);
                else
                    reject(error);
            }
        });
    }

}

module.exports = Connection;