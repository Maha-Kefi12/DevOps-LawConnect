pipeline {
    agent none
    
    tools {
        maven 'Maven-3.9.5'
        jdk 'JDK-17'
    }
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_HUB_USERNAME = '12mahe'  // Your Docker Hub username
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        GIT_CREDENTIALS_ID = 'github-credentials'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/lawconnect-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/lawconnect-frontend"
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
                                # Check if package-lock.json exists
                                if [ ! -f "package-lock.json" ]; then
                                    echo "⚠️ package-lock.json not found, using npm install instead"
                                    npm install --legacy-peer-deps
                                else
                                    echo "✅ package-lock.json found, using npm ci"
                                    npm ci --legacy-peer-deps
                                fi
                                
                                # Build Angular app
                                npm run build
                                
                                # Check where files actually are
                                echo "=== Current dir (lawapp) ==="
                                pwd
                                ls -la
                                
                                echo "=== Parent directory ==="
                                cd ..
                                pwd
                                ls -la
                                
                                echo "=== Looking for dist recursively ==="
                                find . -type d -name "dist" -o -type f -name "*.js" | grep -E "(main|polyfills|runtime)" | head -10
                            '''
                        }
                        
                        // Check both locations
                        script {
                            // Check if dist is in lawapp/dist
                            dir('lawapp') {
                                if (fileExists('dist')) {
                                    echo "✅ Found dist in lawapp/dist"
                                    sh 'ls -laR dist/ | head -20'
                                    stash includes: 'dist/**/*', name: 'frontend-dist', allowEmpty: false
                                    return
                                }
                            }
                            
                            // Check if dist is in workspace root
                            if (fileExists('dist')) {
                                echo "✅ Found dist in workspace root"
                                sh 'ls -laR dist/ | head -20'
                                stash includes: 'dist/**/*', name: 'frontend-dist', allowEmpty: false
                                return
                            }
                            
                            error("❌ Cannot find dist folder anywhere!")
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
                                // Build with explicit tag including username
                                sh """
                                    docker build -t ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER} .
                                    docker tag ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER} ${env.BACKEND_IMAGE}:latest
                                """
                                echo "Built image: ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER}"
                                
                                // Push to registry
                                docker.withRegistry("", env.DOCKER_CREDENTIALS_ID) {
                                    sh """
                                        docker push ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER}
                                        docker push ${env.BACKEND_IMAGE}:latest
                                    """
                                }
                                echo "✅ Successfully pushed backend image to Docker Hub"
                            }
                        }
                    }
                }
                
                stage('Docker Build Frontend') {
                    agent { label 'slave2' }
                    steps {
                        unstash 'source-code'
                        unstash 'frontend-dist'
                        
                        echo "Building Frontend Docker image on Slave 2..."
                        script {
                            // Clone the lawapp repo directly to get Dockerfile
                            sh '''
                                cd "${WORKSPACE}"
                                
                                echo "=== Cloning lawapp repository ==="
                                rm -rf lawapp-temp
                                git clone https://github.com/Maha-Kefi12/lawapp.git lawapp-temp
                                
                                # Copy Dockerfile and nginx.conf to lawapp directory
                                cp lawapp-temp/Dockerfile lawapp/
                                cp lawapp-temp/nginx.conf lawapp/
                                rm -rf lawapp-temp
                                
                                echo "=== Checking lawapp contents ==="
                                ls -la lawapp/
                                
                                # Copy dist to lawapp if needed
                                if [ -d "dist" ]; then
                                    cp -r dist lawapp/ || true
                                fi
                            '''
                            
                            dir('lawapp') {
                                sh '''
                                    echo "=== Final check before build ==="
                                    ls -la
                                    
                                    if [ ! -f "Dockerfile" ]; then
                                        echo "ERROR: Still no Dockerfile!"
                                        exit 1
                                    fi
                                    
                                    echo "✅ Ready to build"
                                '''
                                
                                // Build
                                sh """
                                    docker build -t ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER} .
                                    docker tag ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER} ${env.FRONTEND_IMAGE}:latest
                                """
                                
                                // Push
                                docker.withRegistry("", env.DOCKER_CREDENTIALS_ID) {
                                    sh """
                                        docker push ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER}
                                        docker push ${env.FRONTEND_IMAGE}:latest
                                    """
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
                sh """
                    # Stop existing containers
                    docker-compose down || true
                    
                    # Pull the images we just built
                    docker pull ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER}
                    docker pull ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER}
                    
                    # Tag images for docker-compose
                    docker tag ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER} final-pipeline_backend:latest
                    docker tag ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER} final-pipeline_frontend:latest
                    
                    # Start all services
                    docker-compose up -d
                    
                    # Wait for services to be healthy
                    sleep 30
                    
                    # Check status
                    docker-compose ps
                """
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
            script {
                if (env.NODE_NAME) {
                    echo "Cleaning up workspace..."
                    cleanWs()
                }
            }
        }
        
        success {
            script {
                node('master') {
                    echo "✅ Pipeline completed successfully!"
                    echo "Frontend: http://localhost"
                    echo "Backend: http://localhost:8080"
                }
            }
        }
        
        failure {
            script {
                node('master') {
                    echo "❌ Pipeline failed!"
                    sh '''
                        # Check if docker-compose.yml exists
                        if [ -f "docker-compose.yml" ]; then
                            docker-compose logs --tail=50 || true
                        else
                            echo "docker-compose.yml not found in workspace"
                            echo "Checking workspace contents:"
                            ls -la || true
                        fi
                    '''
                }
            }
        }
    }
}
