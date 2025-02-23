packer {
  required_plugins {
    amazon = {
      version = ">= 1.1.4"
      source  = "github.com/hashicorp/amazon"
    }
  }
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
      # "sudo apt-get update && sudo apt-get upgrade -y",
      # "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-common",
      # "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-client-8.0 mysql-server-8.0",
      # "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server",
      "sudo useradd -r -s /usr/sbin/nologin csye6225",
      "sudo mkdir -p /opt/app && sudo chown csye6225:csye6225 /opt/app"
    ]
  }
}