# What we're building

## The goal

On event day, players should be able to do three things:

1. Open `ctf.<your-domain>` in a browser, register a team, and read the challenges.
2. Reach every challenge that has a server. Web challenges open in the browser, and pwn challenges are reached with an `nc` command in the terminal.
3. Submit flags and watch the scoreboard update.

The organisers need two more things. They need to hear about a problem before the players do, and they must not lose the scores if something breaks. When the event is over, everything has to be deleted so that the club stops paying for it.

## The chain of parts

No single piece of software does all of that. The system is a chain of parts, and each part can only work once the part beneath it exists. The diagram starts from the goal at the top and follows what each part needs, down to the foundation at the bottom.

<figure class="diagram">
--8<-- "diagrams/chain.svg"
<figcaption>Each arrow reads "needs", "runs on" or "lives in". The numbers give the order in which the parts are built, which is also the order of the next six pages.</figcaption>
</figure>

| Part | What it gives players | Without it |
|---|---|---|
| 1 · The AWS account and the domain | A place to rent computers, and the name `<your-domain>` | There is nowhere to build anything, and nothing for players to type. |
| 2 · The network and the computers | Rented computers that are connected to the internet but protected from it | The software has nothing to run on. |
| 3 · Kubernetes and its helpers | A manager that starts every program, restarts any program that crashes, and connects the programs to the internet | Someone would have to start every program by hand and fix every crash themselves. |
| 4 · The scoreboard | CTFd, where players register, read challenges and submit flags | Players have no website to visit. |
| 5 · The challenges | The web and pwn programs that players attack | Players have nothing to solve. |
| 6 · Alarms and backups | A message in Discord when something breaks, and an hourly copy of the scores | Problems go unnoticed, and a broken disk loses the scores. |

You build the chain from the bottom up, because each part needs the one beneath it, and the next six pages explain the parts in that same order.

## Three ways a part is defined

Each part is set up in one or more of three ways. Every page in this section ends with a short *Where it lives* table that names which ways apply to that part.

| Kind | What it is | Example |
|---|---|---|
| **Files in the repository** | Text files in the club's code repository, `wh-base` on GitHub, which every event copies. They describe what should exist, and you change the system by editing them. | `utils/eks/vpc.tf` describes the private network. |
| **Commands** | Lines you type into a terminal. A command either reads those files and makes the real system match them, or it asks the system a question. | `make deploy-eks` builds parts 2 and 3. |
| **Web dashboards** | Websites where you click buttons. The guide uses them only when there is no other way, and each one has a screen recording. | Signing up for AWS happens on aws.amazon.com. |

Most of the system is files, because a file can be read, reviewed and reused next year. Commands turn the files into the running system, and only the account setup needs a dashboard.

**Next:** [1 · The AWS account and the domain](account.md).
