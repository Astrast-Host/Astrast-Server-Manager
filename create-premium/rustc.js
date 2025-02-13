module.exports = {
    isGameServer: false,
    isDisabled: false,
    subCategory: "Languages",
    createServer: createServer
}

function createServer(ServerName, UserID){
    return {
        name: ServerName,
        user: UserID,
        nest: 4,
        egg: 14,
        docker_image: "ghcr.io/parkervcp/yolks:rust_latest",
        startup: `if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; cargo run --release`,
        limits: {
            memory: 0,
            swap: -1,
            disk: 0,
            io: 500,
            cpu: 0,
        },
        environment: {
            AUTO_UPDATE: "1",
        },
        feature_limits: {
            databases: 2,
            allocations: 5,
            backups: 10,
        },
        deploy: {
            locations: botswebdbPREM,
            dedicated_ip: false,
            port_range: [],
        },
        start_on_completion: false
    };
};