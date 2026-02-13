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
