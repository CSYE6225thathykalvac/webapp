#!/bin/bash
source .env

echo "Update package lists"
sudo apt update -y

echo "Upgrade packages"
sudo apt upgrade -y

sudo "installing unzip"
sudo apt install unzip

echo "Install MySQL"
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

echo "sql create db"
sudo mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
sudo mysql -u root -p"$DB_PASSWORD" -e "ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -u root -p"$DB_PASSWORD" -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -u root -p"$DB_PASSWORD" -e "FLUSH PRIVILEGES;"


echo "Create application group"
sudo groupadd -f GNcsye6225

echo "Create application user and add to group"
sudo useradd -m -g GNcsye6225 UNcsye6225 || true

echo "Create application directory"
sudo mkdir -p /opt/csye6225

echo "Unzip application"
if [ -f "/opt/csye6225/webapp.zip" ]; then
  sudo unzip -o /opt/csye6225/webapp.zip -d /opt/csye6225
else
  echo "webapp.zip not found in /opt/csye6225"
fi

echo "Update permissions"
sudo chown -R UNcsye6225:GNcsye6225 /opt/csye6225
sudo chmod -R 750 /opt/csye6225
sudo find /opt/csye6225 -type f -exec chmod 640 {} +
sudo find /opt/csye6225 -type d -exec chmod 750 {} +

