pipeline {
    agent any

    stages {

        stage('Clone Repo') {
            steps {
                git 'https://github.com/GarreVikramSaketh/campus-booking-devops.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install || true'
            }
        }

        stage('Build & Deploy (Docker)') {
            steps {
                sh '''
                docker-compose down -v || true
                docker-compose up --build -d
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh 'docker ps'
            }
        }
    }
}