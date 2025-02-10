module.exports = {
    isGameServer: false,
    isDisabled: false,
    subCategory: "Voice Servers",
    createServer: createServer
}

function createServer(ServerName, UserID) {
    return {
        name: ServerName,
        user: UserID,
        nest: 3,
        egg: 25,
        docker_image: "ghcr.io/parkervcp/yolks:java_17",
        startup: `java -jar Lavalink.jar`,
        limits: {
            memory: 0,
            swap: -1,
            disk: 10240,
            io: 500,
            cpu: 0,
        },
        environment: {
            VERSION: "latest",
            GITHUB_PACKAGE: "lavalink-devs/Lavalink",
            MATCH: "Lavalink.jar",
        },
        feature_limits: {
            databases: 2,
            allocations: 1,
            backups: 10,
        },
        deploy: {
            locations: botswebdbPREM,
            dedicated_ip: false,
            port_range: [],
        },
        start_on_completion: false,
        oom_disabled: false,
    };
};