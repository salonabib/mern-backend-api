class MockMongoMemoryServer {
    constructor() {
        this.uri = 'mongodb://localhost:27017/test';
        this.dbName = 'test';
    }

    static async create() {
        return new MockMongoMemoryServer();
    }

    async start() {
        return this.uri;
    }

    async stop() {
        // Mock stop method
    }

    getUri() {
        return this.uri;
    }

    getDbName() {
        return this.dbName;
    }
}

module.exports = {
    MongoMemoryServer: MockMongoMemoryServer
}; 