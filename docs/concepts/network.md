# 2 · The network and the computers

With an account in place, the club can rent computers inside it. The programs that players use need somewhere to run, and those computers must be reachable by players without being open to anyone who wants to break in. This part provides both: a private network, the computers inside it, and a single controlled way in.

## The private network

<figure class="diagram">
--8<-- "diagrams/network.svg"
<figcaption>The load balancer is the only way in for players. All three computers reach the internet through the one NAT gateway, and the replies come back the same way.</figcaption>
</figure>

| Term | What it is |
|---|---|
| **VPC** | The club's own private network inside the region. |
| **Subnet** | A slice of the VPC inside one availability zone. A **public** subnet can be reached from the internet, and a **private** subnet can't. |
| **EC2** | The service that rents out computers. Each one is a **virtual machine**, which is a slice of a large physical server. This system uses three `t3.medium` machines, one in each zone, each with 2 processor cores and 4 GB of memory. |
| **Load balancer** | A service that receives incoming connections and passes each one to a computer that is working. AWS's **NLB** (Network Load Balancer) does this without reading the traffic. |
| **NAT gateway** | A device that sends the private computers' requests out to the internet and passes the replies back to them, while refusing any connection that starts outside. A home router works the same way. |

The computers have no public address, so nothing on the internet can start a conversation with them. They still need to download software and challenge images, and the NAT gateway makes that possible. When a computer asks a website for a file, the request goes through the NAT gateway, which sends it on with its own public address and notes which computer asked. The website sends the file back to the NAT gateway, and the NAT gateway looks at its notes and passes the file on to the computer that asked. A download is simply the reply to a request, so it comes back along the same path. The NAT gateway only refuses connections that someone outside tries to open first, because no computer asked for them and its notes have no match.

## Storage

The computers can be replaced at any time, so anything that must survive is kept in storage that lives apart from them.

| Term | What it is |
|---|---|
| **EBS** | A network disk attached to one computer. The scoreboard's database lives on one of these, so the scores survive when the program restarts. |
| **S3** | AWS's file storage, where files go into containers called **buckets**. The system keeps its backups and its build records there. Every AWS customer shares one set of bucket names, so each bucket name must be unique. |
| **Secrets Manager** | A locked store for passwords, keys and tokens. The system reads its **secrets** from here and never from files in the code, so the repository can be shared without giving anything away. |

## How it is written down: Terraform

Nobody creates this network by clicking through the AWS console, because nobody could repeat those clicks exactly next year. Instead, files in the repository describe the network, and a tool called **Terraform** makes AWS match them. This approach is called **infrastructure as code**.

Here is part of `utils/eks/vpc.tf`, the file that describes the private network. You don't need to understand every line, but you can already recognise the parts from the diagram above:

```hcl
module "vpc" {
  name = "${var.event_name}-eks-vpc"

  private_subnets = ["10.100.10.0/24", "10.100.11.0/24", "10.100.12.0/24"]
  public_subnets  = ["10.100.0.0/24", "10.100.1.0/24", "10.100.2.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}
```

The three private and three public subnets match the three zones, and `single_nat_gateway` says that one NAT gateway serves all of them. `${var.event_name}` is a **variable**, which is a value that you fill in once in a settings file, `utils/eks/terraform.tfvars.json`, so that the same files can build next year's event under a new name.

<figure class="diagram">
--8<-- "diagrams/tf-cycle.svg"
<figcaption>Terraform compares what should exist with what it built last time, and then changes only the difference. Never delete the state file by hand, because without it Terraform can neither update nor delete what it built.</figcaption>
</figure>

| Command | What it does |
|---|---|
| `terraform plan` | Lists the changes it would make. |
| `terraform apply` | Makes those changes. |
| `terraform destroy` | Deletes everything the files describe. |

You rarely type these commands yourself. The file `utils/Makefile` gives each long sequence of commands a short name, called a **target**, and you run a target by typing `make` followed by its name. `make deploy-eks` runs Terraform on every file in `utils/eks/`.

## Where it lives

| Kind | What you touch |
|---|---|
| Files in the repository | `utils/eks/vpc.tf` for the network, `utils/eks/main.tf` for the computers and buckets, including the Secrets Manager entry. |
| Settings file | `utils/eks/terraform.tfvars.json`, which holds your event name, domain and number of computers. You tell git to ignore it, so it is never uploaded. |
| Commands | `make deploy-eks` builds this part together with part 3. `make secrets` fills in the secrets. |
| Web dashboards | None. You can look at the result in the AWS console, but you never change it there, because Terraform would undo the change the next time it runs. |

You fill in the settings in [Your settings](../code/make-it-yours.md) and build this part in [Deploy · 1. The cluster](../deploy/eks.md).

**Next:** [3 · Kubernetes and its helpers](kubernetes.md).
