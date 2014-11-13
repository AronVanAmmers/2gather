[![Stories in Ready](https://badge.waffle.io/eris-ltd/ponos.png?label=ready&title=Ready)](https://waffle.io/eris-ltd/ponos)

## Ponos -- The Tasks Management Platform

### Overview

Ponos was the God of Toil. Ponos is a platform for tracking and self organizing an organization's workforce around getting done what needs to be done.

Using smart contracts to track the tasks which an organization (or portions of a particular organization), Eris Industries will be capable of building a platform whereby different task paradigms from shift workers in a customer service or health-care center to project based workers in high technology or other fields can be tracked through the lifeline of the task. These contracts will allow managers of business units to increase employee and contractor utility by allowing employees and contractors (collectively referred to herein as "workers") to self organize to accomplish the range and breadth of tasks which the organization needs to complete.

Ponos, as with the other platforms which Eris Industries is in the process of developing, will be built in a modular fashion. This modular design, of which Eris Industries is one of only a few organizations in the world currently capable of implementing, allows for extensibility within a framework. In turn, this extensibility allows organizational clients of Eris Industries to benefit from both the certainty and efficiencies which smart contracts bring to their operations along with the flexibility and extensibility which Eris Industries' smart contract design patterns provide.

### Smart Contract Task Trackers

The tasks which an organization needs to accomplish will be tracked in smart contracts. There will be two types of task trackers which will be used by different Ponos deployments.

For project oriented Ponos systems, tasks will be tracked on a one task per contract basis. This is necessary as in project oriented systems, each task needs to be tracked along with its sub-tasks, its predecessors, its dependent tasks, the tasks which will come into being after the task is completed, and numerous other metrics.

For shift oriented Ponos systems, tasks will be tracked on a one shift per contract basis. In general, tasks which are simply shifts do not need to contain the assorted requirements which project based tasks require.

No matter whether the specific Ponos system is a shift oriented system or a project oriented system (or a mix of the two), tasks will operate in roughly the same manner.

* a node within the system (usually a human based node in a manager position) will determine the scope of work (either the number of workers required for a given shift, or the specific tasks which need to be accomplished);
* a market will open for workers to commit to completing the task -- workers will bid on specific tasks using their reputation points -- this is called the `primary market` within the Ponos system;
* once the market closes, tasks which have not been bid on will be assigned by the initiating node (again, usually a human based node in a manager position) this assignment phase can be automated;
* once all the tasks have been committed to be completed (either through bidding or assignment) then the tasks will be back on the market until their starting point so that workers may be able to pay reputation points to another worker to take their task for them, or to trade tasks between workers -- this is called the `secondary market` within the Ponos system;
* when the task is set to begin, the node which has committed to completing that task at that given moment (no matter who originally bid on the task or was assigned the task) is liable for the successful completion of the task;
* if a task has not been successfully completed on time and satisfactorily, the worker committed to completing the task will have their reputation points negatively affected according to the business rules established by the deploying organization;
* if a task has been successfully completed on time and satisfactorily, the worker committed to completing the task will have their reputation points positively affected according to the business rules established by the deploying organization.

In addition to the above, normal, sequence smart contract task trackers will be capable of dynamic task allocation which additional tasks are required (such as when a surge is necessary in a shift oriented Ponos system) or when less tasks are required (such as placing people on call in a shift oriented Ponos system).

### Reputation Points

The "currency" in which Ponos systems operate is the reputation of the workers authorized to commit and complete tasks for the organization. Various business rules can be established by deploying organizations for how workers can "spend" and "gain" reputation points (or, as Eris Industries is currently calling it, `shift bucks`).

Each Ponos system will be deployed using an Eris Industries built DOUG (the Decentralized Organization Upgrade Guy) system. DOUG systems allow for systems of smart contracts to provide both certainty of outcomes as well as extensibility in how the systems operate. The utilization of a DOUG framework for deployed Ponos systems will allow organizational clients to modify the business rules for gaining, spending `shift bucks` as well as as the assignment of tasks, along with other changes required for the system to stay in line with the corporate goals and methodologies of the particular organizational client utilizing the system.

Reputation points generally would be gained (at a minimum) for successful completion of tasks. In addition, reputation could also be gained from accepting another's task (e.g., paying reputation by one worker to another to take their shift for them). There are various business rules which will affect a worker's stash of `shift bucks` and these will be established in DOUG-based reference contracts.

The reputation of workers are held in smart contract databases of which Eris Industries is a pioneer. Write access to these databases are controlled using reference contracts which hold the business rules for which nodes within the network are capable of adding to or taking away `shift bucks` from a particular worker's address.

### Smart Contract Transaction Reference Contracts

As with other Eris Industries built smart contract systems, reference contracts are used to determine the business rules for the system. Because these exist within a DOUG based system they can be changed over time as the needs of the organization change.

These business rules determine how tasks are distributed during the assignment phase, how and when tasks may be placed on the primary market (for initial commitment by nodes in the network) and then placed on the secondary market (for transfer between nodes within the network) as well as the the rules for how reputation points (`shift bucks`) are gained and lost. An overview of the system is below:

![ponos smart contracts architecture](docs/images/ponos-smart-contracts-architecture.png)

### API Interface

Ponos will run on a cluster of peer servers which have been deployed to Eris Industries' Bostejo Smart Contracts Platform. Ponos will not come with an integrated user interface because the various ways in which organizational clients handle tasks is greatly divergent. To ensure compatibility with other enterprise resource platforms, Eris Industries will build a unified API structure which organizational clients may use to interface with the Ponos system. The API interface will allow for structured transactions to be sent to the Bostejo deployed peer server using the highest level of public-private key encryption currently available. The Ponos API will allow for both extensive querying of the state of tasks as well as transacting with the blockchain.

By utilizing an API interface as opposed to running Ponos on organizational laptops and desktops, interfacing with the Ponos platform will be greatly simplified. In addition, Eris Industries will not have the capacity (during its initial phases) to develop all of the base line technology required to develop such a backend platform *along with* a harmonized user interface. That observation in combination with the observation that each organizational client will utilize different enterprise level systems for tracking and interfacing with their tasks brings Eris Industries to conclude that providing a well formulated API will be of greater benefit during the initiation phases of the company than expending resources to develop a well formulated user interface would.

### Reporting Interface

While Eris Industries does not intend to develop a full user interface for the Ponos platform at the current time, Eris Industries will be developing a reporting framework which will be capable of providing an overview to decision makers of the state of organizational tasks. These reports can be established to run at predetermined times and will be emailed to appropriate personnel within the organization who has deployed an Ponos system. The API will be capable of providing a real time understanding of the state of the tasks tracked on the organization's blockchain, and the reporting framework will operate in connection with the API.
