timestamps {
    environment {
        DB_USER        = 'bhima'
        DB_HOST        = '127.0.0.1'
        DB_PORT        = '3306'
        DB_NAME        = 'bhima'
        PORT           = '8080'
        BHIMA_DATA_DIR = 'bhima-data/'
        BUILD_TIMEOUT  = '30'
        CI             = '1'
        PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium'
    }

    node {
        checkout scm

        // Create an isolated Docker network for the build.
        def network = "ci-${env.BUILD_TAG}".replaceAll(/[^A-Za-z0-9_.-]/, "-")

        sh "docker network create ${network}"

        try {
            docker.image('mysql:8.4').withRun(
                "--network ${network}" +
                " --network-alias mysql" +
                " -e MYSQL_ROOT_PASSWORD=my-secret-pw"
            ) { mysql ->

                docker.image('redis:8').withRun(
                    "--network ${network}" +
                    " --network-alias redis"
                ) { redis ->

                    // Wait until MySQL is accepting connections.
                    sh """
                        until docker exec ${mysql.id} mysqladmin \
                            -uroot \
                            -pmy-secret-pw \
                            ping --silent; do
                            sleep 1
                        done
                    """

                    echo 'MySQL is ready.'
                    echo 'Redis is running.'
                    echo 'Hello!'

                    docker.image('node:lts-trixie-slim').inside("--network ${network}") {
                      // note that this client is maria-db compatible.  I don't think we should need 
                      // the mysql8 client.
                      sh 'sudo apt install default-mysql-client chromium -y'
                      sh 'npm ci'
                      sh 'npm run build'
                      sh 'npm run test:integration'
                    }
                }
            }
        } finally {
            sh "docker network rm ${network} || true"
        }
    }
}
