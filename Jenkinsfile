pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        DB_USER        = 'bhima'
        DB_HOST        = 'mysql'
        DB_PORT        = '3306'
        DB_NAME        = 'bhima'
        PORT           = '8080'
        BHIMA_DATA_DIR = 'bhima-data/'
        CI             = '1'
        PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium'
        DB_PASS        = credentials('bhima-ci-db-pass')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('End-to-End Tests') {
            steps {
                script {
                    env.NETWORK_NAME = "ci-${env.BUILD_TAG}".replaceAll(/[^A-Za-z0-9_.-]/, '-')

                    sh "docker network create '${env.NETWORK_NAME}'"

                    docker.image('mysql:8.4').withRun(
                        "--network ${env.NETWORK_NAME}" +
                        " --network-alias mysql" +
                        " -e MYSQL_ROOT_PASSWORD=${env.DB_PASS}" +
                        " -e MYSQL_DATABASE=${env.DB_NAME}" +
                        " -e MYSQL_USER=${env.DB_USER}" +
                        " -e MYSQL_PASSWORD=${env.DB_PASS}"
                    ) { mysql ->

                        docker.image('redis:8').withRun(
                            "--network ${env.NETWORK_NAME}" +
                            " --network-alias redis"
                        ) { redis ->

                            sh '''
                                until docker exec '"${mysql.id}"' \
                                    mysqladmin \
                                    -uroot \
                                    -p'"${DB_PASS}"' \
                                    ping --silent; do
                                    sleep 1
                                done
                            '''

                            echo 'MySQL is ready.'
                            echo 'Redis is running.'

                            docker.image('node:lts-trixie-slim').inside(
                                "--network ${env.NETWORK_NAME} --user root"
                            ) {

                                sh '''
                                    apt-get update
                                    apt-get install -y --no-install-recommends \
                                        default-mysql-client \
                                        chromium

                                    npm ci
                                    npm run build
                                    npm run test:integration
                                '''
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                if (env.NETWORK_NAME) {
                    sh "docker network rm '${env.NETWORK_NAME}' || true"
                }
            }
            cleanWs()
        }

        failure {
            echo 'Build failed — check the stage logs above for details.'
        }
    }
}
