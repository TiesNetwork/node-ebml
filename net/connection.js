const io = require('socket.io-client');
const WebSocketClient = require('websocket').client;
const Builder = require('../request/builder');

class Connection {

    constructor(url){
        let socket = new WebSocketClient();
        socket.connect(url);
        this.socket = socket;
        this.requestId = 0;
        this.requests = {};

        const self = this;

        this.waitForConnection = new Promise(((resolve, reject) => {
            socket.on('connect', (connection) => {
                self.connection = connection;

                console.log('connected!');

                connection.on('close', () => { console.log('closed!') });
                connection.on('error', (error) => { console.log('Connection error: ' + error) });
                connection.on('message', (data) => { console.log('Data: ' + JSON.stringify(data)) });

                resolve(connection);
            });

            socket.on('connectFailed', (error) => {
                console.log('connect error: ' + error);
                reject(error);
            });
        }));
    }

    modify(records, pk) {
        let builder = new Builder(records);
        let data = builder.buildModification(pk, ++this.requestId);
        let self = this;

        if(!this.connection || !this.connection.connected)
            throw new Error('Connection is not open!');

        this.connection.sendBytes(Buffer.concat([Buffer.from('C001BA5E1225EFFF0000000000000001', 'hex'), data]));

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