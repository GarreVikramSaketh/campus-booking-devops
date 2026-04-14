pipeline {
    agent any

    stages {
        stage('Clone Repo') {
            steps {
                git 'https://github.com/GarreVikramSaketh/campus-booking-devops.git'
            }
        }

        stage('Build Docker') {
            steps {
                sh 'docker-compose down -v || true'
                sh 'docker-compose up --build -d'
            }
        }
    }
}