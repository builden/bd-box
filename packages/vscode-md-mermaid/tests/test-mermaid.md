# Mermaid Diagram Test

## Flowchart

```mermaid
graph TD;
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

## Class Diagram

```mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
```

## Architecture Diagram

```mermaid
architecture-beta
    group api[API Services]
        service frontend(logos:react)[Frontend] in api
        service backend(logos:nodejs)[Backend] in api
    group data[Data Layer]
        service db(logos:postgresql)[Database] in data
        service cache(logos:redis)[Cache] in data

    frontend:R --> L:backend
    backend:T --> B:db
    backend:R --> L:cache
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Error --> Idle: Retry
    Success --> [*]
```

## Entity Relationship Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "is in"
    CUSTOMER {
        string name
        string email
        int age
    }
    ORDER {
        date orderDate
        string status
    }
    PRODUCT {
        string name
        float price
    }
```

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1           :a1, 2024-01-01, 30d
    Task 2           :a2, after a1, 20d
    section Phase 2
    Task 3           :b1, after a2, 15d
    Task 4           :b2, after b1, 10d
```

## Pie Chart

```mermaid
pie
    title Pets
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
```

## Mindmap

```mermaid
mindmap
  root((Main Topic))
    Branch 1
      Subbranch 1.1
      Subbranch 1.2
    Branch 2
      Subbranch 2.1
      Subbranch 2.2
```

## Journey

```mermaid
journey
    title User Journey
    section Login
      Enter credentials: 5: User
      Click login: 5: User
      See dashboard: 4: User
    section Search
      Type query: 5: User
      View results: 3: User
      Click result: 4: User
```

---

# DOT Diagram Test

## Basic Flowchart (default box shape)

```dot
digraph {
    Start -> Process -> End;
}
```

## Flowchart with Circle Start/End (green)

```dot
digraph {
    node [shape=circle];
    Start -> Middle -> End;
}
```

## Decision Diamond (yellow)

```dot
digraph {
    node [shape=diamond];
    Input -> Decision -> Yes;
    Decision -> No -> End;
}
```

## Process Box (blue)

```dot
digraph {
    node [shape=box];
    A -> B -> C -> D;
}
```

## Parallelogram (purple)

```dot
digraph {
    node [shape=parallelogram];
    Input -> Process -> Output;
}
```

## Hexagon (orange)

```dot
digraph {
    node [shape=hexagon];
    Prepare -> Execute -> Complete;
}
```

## Mixed Shapes

```dot
digraph {
    Start [shape=circle];
    Decision [shape=diamond];
    Process1 [shape=box];
    Process2 [shape=box];
    End [shape=circle];

    Start -> Decision;
    Decision -> Process1 [label="Yes"];
    Decision -> Process2 [label="No"];
    Process1 -> End;
    Process2 -> End;
}
```

## Undirected Graph

```dot
graph {
    A -- B;
    B -- C;
    C -- D;
    A -- D;
}
```

## Complex Flowchart

```dot
digraph {
    node [shape=box];
    User -> Login -> Dashboard;
    Dashboard -> Search -> Results;
    Results -> ViewDetail -> Cart;
    Cart -> Checkout -> Order;
    Order -> Confirmation;

    Search -> NoResults [style=dashed];
    NoResults -> Dashboard;
}
```

## State Machine

```dot
digraph {
    node [shape=ellipse];
    Idle -> Running [label="start"];
    Running -> Paused [label="pause"];
    Paused -> Running [label="resume"];
    Running -> Stopped [label="stop"];
    Stopped -> Idle [label="reset"];
}
```
