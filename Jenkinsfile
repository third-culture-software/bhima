timestamps {
    node {
        checkout scm

        // Create an isolated Docker network for the build.
        def network = "jenkins-${env.BUILD_TAG}".replaceAll(/[^A-Za-z0-9_.-]/, "-")

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

                    docker.image('node:24').inside("--network ${network}") {
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
