packer {
  required_plugins {
    amazon = {
      version = ">= 1.1.4"
      source  = "github.com/hashicorp/amazon"
    }
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
    owners      = ["099720109477"] # Canonical's owner ID for Ubuntu AMIs
  }
  ssh_username = "ubuntu"
  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
    delete_on_termination = true
  }
}

build {
  name = "learn-packer"
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  provisioner "shell" {
    inline = [
      "sudo DEBIAN_FRONTEND=noninteractive apt-get update --fix-missing",
      "sudo apt-get update -y && sudo apt-get upgrade -y || true",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server",
      # Secure MySQL Installation using Packer variables
      <<-EOF
      sudo mysql --user=root <<MYSQL_SCRIPT
      ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${var.db_password}';
      CREATE DATABASE IF NOT EXISTS ${var.db_name};
      CREATE USER IF NOT EXISTS '${var.db_user}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${var.db_password}';
      GRANT ALL PRIVILEGES ON ${var.db_name}.* TO '${var.db_user}'@'localhost';
      FLUSH PRIVILEGES;
      MYSQL_SCRIPT
      EOF
      ,
      "sudo systemctl restart mysql",
      "sudo useradd -r -s /usr/sbin/nologin csye6225",
      "sudo mkdir -p /opt/csye6225",
      "sudo mkdir -p /opt/app && sudo chown csye6225:csye6225 /opt/csye6225"
    ]
  }
  # Copy the application artifact to the AMI
  provisioner "file" {
    source      = "webapp.zip"
    destination = "/opt/csye6225/webapp.zip"
  }

  # Ensure the artifact is owned by the csye6225 user
  provisioner "shell" {
    inline = [
      "sudo chown csye6225:csye6225 /opt/csye6225/webapp.zip"
    ]
  }
}