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

        stage('Deploy to AWS EC2') {
            steps {
                sh '''
                ssh -o StrictHostKeyChecking=no -i /Users/vikramsakethg/Downloads/new-campus-key.pem ec2-user@34.203.21.31 "

                if [ ! -d campus-booking-devops ]; then
                    git clone https://github.com/GarreVikramSaketh/campus-booking-devops.git
                fi

                cd campus-booking-devops
                git pull

                docker-compose down -v || true
                docker-compose up --build -d

                "
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                ssh -o StrictHostKeyChecking=no -i /Users/vikramsakethg/Downloads/new-campus-key.pem ec2-user@34.203.21.31 "
                docker ps
                "
                '''
            }
        }
    }
}