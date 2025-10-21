pipeline {
    agent none
    
    tools {
        maven 'Maven-3.9.5'
        jdk 'JDK-17'
    }
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        GIT_CREDENTIALS_ID = 'github-credentials'
        BACKEND_IMAGE = 'lawconnect-backend'
        FRONTEND_IMAGE = 'lawconnect-frontend'
        MYSQL_IMAGE = 'mysql:8.0'
    }
    
    stages {
        stage('Checkout') {
            agent { label 'master' }
            steps {
                echo "Checking out code from GitHub..."
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Maha-Kefi12/DevOps-LawConnect.git',
                        credentialsId: env.GIT_CREDENTIALS_ID
                    ]]
                ])
                stash includes: '**', name: 'source-code'
            }
        }
        
        stage('Parallel Build') {
            parallel {
                stage('Build Backend') {
                    agent { label 'slave1' }
                    steps {
                        unstash 'source-code'
                        dir('LawConnectBackend') {
                            echo "Building Spring Boot Backend on Slave 1..."
                            sh 'mvn clean package -DskipTests'
                            stash includes: 'target/*.jar', name: 'backend-jar'
                        }
                    }
                }
                
                stage('Build Frontend') {
                    agent { label 'slave2' }
                    steps {
                        unstash 'source-code'
                        dir('lawapp') {
                            echo "Building Angular Frontend on Slave 2..."
                            sh '''
                                npm ci --legacy-peer-deps
                                npm run build --prod
                            '''
                            stash includes: 'dist/**', name: 'frontend-dist'
                        }
                    }
                }
            }
        }
        
        stage('Parallel Docker Build') {
            parallel {
                stage('Docker Build Backend') {
                    agent { label 'slave1' }
                    steps {
                        unstash 'source-code'
                        unstash 'backend-jar'
                        dir('LawConnectBackend') {
                            echo "Building Backend Docker image on Slave 1..."
                            script {
                                def backendImage = docker.build("${env.BACKEND_IMAGE}:${env.BUILD_NUMBER}")
                                docker.withRegistry("https://${env.DOCKER_REGISTRY}", env.DOCKER_CREDENTIALS_ID) {
                                    backendImage.push("${env.BUILD_NUMBER}")
                                    backendImage.push("latest")
                                }
                            }
                        }
                    }
                }
                
                stage('Docker Build Frontend') {
                    agent { label 'slave2' }
                    steps {
                        unstash 'source-code'
                        dir('lawapp') {
                            echo "Building Frontend Docker image on Slave 2..."
                            script {
                                def frontendImage = docker.build("${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER}")
                                docker.withRegistry("https://${env.DOCKER_REGISTRY}", env.DOCKER_CREDENTIALS_ID) {
                                    frontendImage.push("${env.BUILD_NUMBER}")
                                    frontendImage.push("latest")
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Deploy with Docker Compose') {
            agent { label 'master' }
            steps {
                unstash 'source-code'
                echo "Deploying full stack on Master..."
                sh '''
                    # Stop existing containers
                    docker-compose down || true
                    
                    # Pull latest images
                    docker-compose pull
                    
                    # Start all services
                    docker-compose up -d
                    
                    # Wait for services to be healthy
                    sleep 30
                    
                    # Check status
                    docker-compose ps
                '''
            }
        }
        
        stage('Health Check') {
            agent { label 'master' }
            steps {
                echo "Performing health checks..."
                script {
                    retry(5) {
                        sleep(time: 10, unit: 'SECONDS')
                        sh '''
                            # Check Backend
                            curl -f http://localhost:8080/actuator/health || exit 1
                            
                            # Check Frontend
                            curl -f http://localhost/ || exit 1
                            
                            # Check MySQL
                            docker exec lawconnect-mysql mysqladmin ping -h localhost || exit 1
                        '''
                    }
                }
                echo "✅ All services are healthy!"
            }
        }
    }
    
    post {
        always {
            node('master') {
                echo "Cleaning up workspace..."
                cleanWs()
            }
        }
        
        success {
            node('master') {
                echo "✅ Pipeline completed successfully!"
                echo "Frontend: http://localhost"
                echo "Backend: http://localhost:8085"
            }
        }
        
        failure {
            node('master') {
                echo "❌ Pipeline failed!"
                sh 'docker-compose logs --tail=50'
            }
        }
    }
}
