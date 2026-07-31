pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        BHIMA_DATA_DIR = 'bhima-data/'
        CI             = '1'
        DB_HOST        = 'mysql'
        DB_NAME        = 'bhima'
        DB_PASS        = 'd1bf0397b30e1136490762669cbc97f1'
        DB_PORT        = '3306'
        DB_USER        = 'bhima'
        PORT           = '8080'
        PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium'
        PUPPETEER_SKIP_DOWNLOAD  = 'true'
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

                    sh "docker network create ${env.NETWORK_NAME}"

                    docker.image('mysql:8.4').withRun(
                        "--network ${env.NETWORK_NAME}" +
                        ' --network-alias mysql' +
                        " -e MYSQL_ROOT_PASSWORD=${env.DB_PASS}" +
                        " -e MYSQL_DATABASE=${env.DB_NAME}" +
                        " -e MYSQL_USER=${env.DB_USER}" +
                        " -e MYSQL_PASSWORD=${env.DB_PASS}"
                    ) { mysql ->
                        docker.image('redis:8').withRun(
                            "--network ${env.NETWORK_NAME}" +
                            ' --network-alias redis'
                        ) { 
                            def mysqlId = mysql.id

                            sh """
                               until docker exec ${mysqlId} \
                                   mysqladmin -uroot -p\$DB_PASS ping --silent; do
                                   sleep 1
                               done
                             """

                            echo 'MySQL is ready.'
                            echo 'Redis is running.'

                            docker.image('node:lts-trixie-slim').inside(
                                "--network ${env.NETWORK_NAME} --user root"
                            ) {
                                writeFile(
                                  file: 'mysql.sources',
                                  text: '''\
Types: deb
URIs: http://repo.mysql.com/apt/debian
Suites: trixie
Components: mysql-8.4-lts
Signed-By: /usr/share/keyrings/mysql.gpg
'''
                              )

                                sh '''

                                apt-get -qq update
                                apt-get -qq install -y --no-install-recommends curl chromium gnupg ca-certificates \
                                  fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-freefont-ttf libxss1

                                curl -fsSL https://repo.mysql.com/RPM-GPG-KEY-mysql-2025 | \
                                  gpg --dearmor -o /usr/share/keyrings/mysql.gpg
                                install -m 644 mysql.sources /etc/apt/sources.list.d/mysql.sources

                                apt-get -qq update && apt-get -qq install -y mysql-common mysql-community-client 

                                su - node -c 'cd "$WORKSPACE"; npm ci; npm run build; npm run test:integration'
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
                    sh "docker network rm ${env.NETWORK_NAME} || true"
                }
            }
        }

        failure {
            echo 'Build failed — check the stage logs above for details.'
        }
    }
}
