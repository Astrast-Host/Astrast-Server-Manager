module.exports = {
    isGameServer: false,
    isDisabled: false,
    subCategory: "Databases",
    createServer: createServer
}

function createServer(ServerName, UserID){
    return {
        name: ServerName,
        user: UserID,
        nest: 6,
        egg: 26,
        docker_image: "quay.io/parkervcp/pterodactyl-images:db_mariadb",
        startup: `{ /usr/sbin/mysqld & } && sleep 5 && mysql -u root`,
        limits: {
            memory: 512,
            swap: -1,
            disk: 1024,
            io: 500,
            cpu: 70,
        },
        environment: {},
        feature_limits: {
            databases: 0,
            allocations: 0,
            backups: 1,
        },
        deploy: {
            locations: botswebdbFREE,
            dedicated_ip: false,
            port_range: [],
        },
        start_on_completion: false,
        oom_disabled: false,
    };
};