packer {
  required_plugins {
    amazon = {
      version = ">= 1.1.4"
      source  = "github.com/hashicorp/amazon"
    }
    # googlecompute = {
    #   version = ">= 1.0.0"
    #   source  = "github.com/hashicorp/googlecompute"
    # }
  }
}

# Define Packer variables
variable "db_name" {
  default = ""
}

variable "db_user" {
  default = ""
}

variable "db_password" {
  default = ""
}

# variable "gcp_password" {
#   default = ".gcp-key.json"
# }
variable "ami_users" {
  type    = string
  default = env("AMI_USER")
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "packer-linux-aws"
  instance_type = "t2.micro"
  region        = "us-east-1"
  profile       = "github"
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  ssh_username = "ubuntu"
  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
    delete_on_termination = true
  }
  ami_users = [var.ami_users]
}

# source "googlecompute" "ubuntu" {
#   image_name       = "packer-linux-gcp"
#   machine_type     = "e2-micro"
#   project_id       = "devcsye6225-452004"
#   zone             = "us-central1-a"
#   source_image     = "ubuntu-2204-jammy-v20231030"
#   ssh_username     = "ubuntu"
#   image_family     = "webapp"
#   disk_size        = 25
#   disk_type        = "pd-ssd"
#   credentials_file = var.gcp_password

# }

build {
  name = "learn-packer"
  sources = [
    "source.amazon-ebs.ubuntu",
    # "source.googlecompute.ubuntu"
  ]

  provisioner "shell" {
    inline = [
      "sudo DEBIAN_FRONTEND=noninteractive apt-get update --fix-missing",
      "sudo apt-get update -y && sudo apt-get upgrade -y || true",
      # "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server",
      # # Secure MySQL Installation using Packer variables
      # <<-EOF
      # sudo mysql --user=root <<MYSQL_SCRIPT
      # ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${var.db_password}';
      # CREATE DATABASE IF NOT EXISTS ${var.db_name};
      # CREATE USER IF NOT EXISTS '${var.db_user}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${var.db_password}';
      # GRANT ALL PRIVILEGES ON ${var.db_name}.* TO '${var.db_user}'@'localhost';
      # FLUSH PRIVILEGES;
      # MYSQL_SCRIPT
      # EOF
      # ,
      # "sudo systemctl restart mysql",
      "sudo groupadd csye6225",
      "sudo useradd -r -s /usr/sbin/nologin -g csye6225 csye6225",

      # Create the application directory and set ownership
      "sudo mkdir -p /opt/csye6225/",
      "sudo chown csye6225:csye6225 /opt/csye6225/",
      "sudo chmod 755 /opt/csye6225/"
    ]
  }

  # Copy the application artifact to the AMI
  provisioner "file" {
    source      = "webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/webapp.zip /opt/csye6225/webapp.zip",
      "sudo chown csye6225:csye6225 /opt/csye6225/webapp.zip"
    ]
  }
  provisioner "shell" {
    inline = [
      # Install unzip
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y unzip",

      # Install Node.js (using NodeSource setup script for the latest LTS version)
      "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs"

    ]
  }

  # Extract the application artifact
  provisioner "shell" {
    inline = [
      "sudo -u csye6225 unzip /opt/csye6225/webapp.zip -d /opt/csye6225/",
      "sudo chown -R csye6225:csye6225 /opt/csye6225/"
    ]
  }
  provisioner "file" {
    source      = "webapp.service"
    destination = "/tmp/webapp.service"
  }
  provisioner "file" {
    source      = "cloud-watch.json"
    destination = "/tmp/cw-config.json"
  }
  provisioner "shell" {
    inline = [
      "cd /opt/csye6225/",
      "sudo npm install",
      "sudo chown -R csye6225:csye6225 node_modules",
      "wget -O /tmp/amazon-cloudwatch-agent.deb https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb || sudo apt-get -f install -y",
      "sudo chown -R root:root /opt/amazon-cloudwatch-agent",
      "sudo systemctl enable amazon-cloudwatch-agent",
      "sudo systemctl start amazon-cloudwatch-agent",
      "sudo mkdir -p /opt/csye6225/logs/",
      "sudo chown -R csye6225:csye6225 /opt/csye6225/logs/",
      "sudo mv /tmp/cw-config.json /opt/cw-config.json",
      "sudo chown csye6225:csye6225 /opt/cw-config.json"
    ]
  }
  # provisioner "file" {
  #   source      = ".env"
  #   destination = "/tmp/.env"
  # }

  provisioner "shell" {
    inline = [
      # "sudo mv /tmp/.env /opt/csye6225/.env",
      # "sudo chown csye6225:csye6225 /opt/csye6225/.env",
      "sudo mv /tmp/webapp.service /etc/systemd/system/",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service"
    ]
  }

}