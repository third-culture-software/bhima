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
        NETWORK_NAME   = "ci-${env.BUILD_TAG}".replaceAll(/[^A-Za-z0-9_.-]/, '-')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Create docker network') {
            steps {
                sh "docker network create '${NETWORK_NAME}'"
            }
        }

        stage('Test End to End') {
            steps {
                script {
                    docker.image('mysql:8.4').withRun(
                        "--network ${NETWORK_NAME}" +
                        " --network-alias mysql" +
                        " -e MYSQL_ROOT_PASSWORD=${DB_PASS}" +
                        " -e MYSQL_DATABASE=${DB_NAME}" +
                        " -e MYSQL_USER=${DB_USER}" +
                        " -e MYSQL_PASSWORD=${DB_PASS}"
                    ) { mysql ->
                        docker.image('redis:8').withRun(
                            "--network ${NETWORK_NAME}" +
                            " --network-alias redis"
                        ) { redis ->

                            stage('Wait for MySQL') {
                                sh """
                                    until docker exec ${mysql.id} mysqladmin \
                                        -uroot -p${DB_PASS} \
                                        ping --silent; do
                                        sleep 1
                                    done
                                """
                                echo 'MySQL is ready.'
                                echo 'Redis is running.'
                            }

                            docker.image('node:lts-trixie-slim').inside("--network ${NETWORK_NAME} --user root") {
                                // note that this client is maria-db compatible; we don't need
                                // the mysql8 client specifically.
                                stage('Install dependencies') {
                                    sh 'apt-get update && apt-get install -y --no-install-recommends default-mysql-client chromium'
                                    sh 'npm ci'
                                }
                                stage('Build') {
                                    sh 'npm run build'
                                }
                                stage('Integration tests') {
                                    sh 'npm run test:integration'
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh "docker network rm '${NETWORK_NAME}' || true"
            cleanWs()
        }
        failure {
            echo 'Build failed — check the stage logs above for details.'
        }
    }
}
