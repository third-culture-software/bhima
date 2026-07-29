pipeline {
    agent none

    options {
        timeout(time: 60, unit: 'MINUTES')
    }

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

        // Configure these under Manage Jenkins > Credentials before running
        DB_PASS     = credentials('bhima-db-pass')
        SESS_SECRET = credentials('bhima-sess-secret')
    }

    stages {

        stage('Update Dependencies') {
            agent { label 'docker' }
            steps {
                sh '''
                    sudo apt-get update -qq
                    sudo apt-get install -y -qq mysql-client redis-tools
                '''
            }
        }

        stage('Integration Testing Matrix') {
            matrix {
                axes {
                    axis {
                        name 'MYSQL_VERSION'
                        values '8.4'
                    }
                    axis {
                        name 'NODEJS_VERSION'
                        values '24', 'node'
                    }
                }

                // requires NodeJS tool installations named exactly "24" and "node"
                // configured under Manage Jenkins > Tools > NodeJS installations
                agent { label 'docker' }
                tools {
                    nodejs "${NODEJS_VERSION}"
                }

                environment {
                    DEBUG = 'app,bhima:errors,app:uploader'
                }

                stages {
                    stage('Checkout') {
                        steps {
                            checkout scm
                        }
                    }

                    stage('Provision Services & Run Tests') {
                        steps {
                            script {
                                docker.image("mysql:${MYSQL_VERSION}").withRun(
                                    "-e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=${DB_NAME} -p 3306:3306"
                                ) { mysqlContainer ->
                                    docker.image('redis:7-alpine').withRun('-p 6379:6379') { redisContainer ->

                                        sh '''
                                            echo "Waiting for MySQL to accept connections..."
                                            until mysql -h $DB_HOST -P $DB_PORT -u root -e "SELECT 1" >/dev/null 2>&1; do
                                                sleep 2
                                            done

                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "CREATE USER $DB_USER@$DB_HOST IDENTIFIED BY '$DB_PASS';"
                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "GRANT ALL PRIVILEGES ON *.* TO $DB_USER@$DB_HOST WITH GRANT OPTION;"
                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "FLUSH PRIVILEGES;"
                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "SET @@global.sql_mode='STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION';"

                                            echo 0 | sudo tee /proc/sys/kernel/apparmor_restrict_unprivileged_userns

                                            echo "Testing node:$NODEJS_VERSION on mysql:$MYSQL_VERSION"
                                            node --version
                                            which chromium

                                            npm ci
                                            npx playwright install --with-deps --no-shell chromium
                                            npm run build:db
                                            npm run build

                                            mkdir -p results
                                            npm run test:server-unit
                                            npm run test:client-unit
                                            npm run test:integration
                                            npm run test:integration:stock
                                            npm run test:e2e-account
                                        '''
                                    }
                                }
                            }
                        }
                    }
                }

                post {
                    always {
                        junit allowEmptyResults: true, testResults: 'results/**/*.xml'
                    }
                }
            }
        }

        stage('Install Testing Matrix') {
            matrix {
                axes {
                    axis {
                        name 'MYSQL_VERSION'
                        values '8.4'
                    }
                    axis {
                        name 'NODEJS_VERSION'
                        values '24', 'node'
                    }
                }

                agent { label 'docker' }
                tools {
                    nodejs "${NODEJS_VERSION}"
                }

                environment {
                    DEBUG = 'app,http,bhima:errors'
                }

                stages {
                    stage('Checkout') {
                        steps {
                            checkout scm
                        }
                    }

                    stage('Provision Services & Run Install Tests') {
                        steps {
                            script {
                                docker.image("mysql:${MYSQL_VERSION}").withRun(
                                    "-e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=${DB_NAME} -p 3306:3306"
                                ) { mysqlContainer ->
                                    docker.image('redis:alpine').withRun('-p 6379:6379') { redisContainer ->

                                        sh '''
                                            echo "Waiting for MySQL to accept connections..."
                                            until mysql -h $DB_HOST -P $DB_PORT -u root -e "SELECT 1" >/dev/null 2>&1; do
                                                sleep 2
                                            done

                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "CREATE USER $DB_USER@$DB_HOST IDENTIFIED BY '$DB_PASS';"
                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "GRANT ALL PRIVILEGES ON *.* TO $DB_USER@$DB_HOST WITH GRANT OPTION;"
                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "FLUSH PRIVILEGES;"
                                            mysql -h $DB_HOST -P $DB_PORT -u root -e "SET @@global.sql_mode='STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION';"

                                            echo 0 | sudo tee /proc/sys/kernel/apparmor_restrict_unprivileged_userns

                                            echo "[Installation] Testing node:$NODEJS_VERSION on mysql:$MYSQL_VERSION"
                                            node --version

                                            npm ci
                                            npm run build
                                            bash ./sh/install-tests.sh
                                        '''
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
