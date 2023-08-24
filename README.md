# Butlermock

[![Made with Fresh](https://fresh.deno.dev/fresh-badge-dark.svg)](https://fresh.deno.dev)

Tool for building mocks from typescript's types/interfaces into object
with actual data using Fakerjs

> Documentation on develop, in the near future I will expose the endpoints for you to use it within your client application, so, stay on tune 🐒

Table of contents
=================

<!--ts-->
   * [Web usage](#web-usage)
   * [API usage](#api-documentation)
   * [Example as package/library](#Example-as-package/library)
   * [FAQs](#faqs)
   * [Limitations](#limitations)
   * [Status](#status)
<!--te-->

# Web usage

Just go to https://butlermock.online/ and in the left panel paste your interfaces or types, just be aware of the [current limitations](#status) ( I am working for supporting the others )

Wait until the monaco editor shows up and paste your interfaces to later clicking the play button and the mock shows up almost immediately.

![Butlermock's landing](doc/assets/landing.png)

> ![button guide](doc/assets/buttons.png)

> The "play" button mocks up, "clipboard" copies the mock created and the "X" button is for cleaning the view

# API documentation

Easy peasy

``` typescript

fetch(new URL("/api/mock", 'https://butlermock.online').href, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      value: `interface Test {
        Hello: "World!";
        }`,
      valueForAny: "null", // any parseable json value, values: "null" | "\"Whatever the text you want\"" | "{}" | "0" | "1" | ... | "9"
      mustReturn: "", // empty or the top-level name of the interfaces that you provided
      quantity: 1, // if is greater than 1, the api response will be an array of the interfaces provided
    }),
  })
  .then(res => res.json()).then(console.log); // should log:
  //{
  // "Test": {
  //    "Hello": "World!"
  //  }
  //}

```

> **Always remember to format your interfacer or type correctly, if you forget to add ";" it may result in bad parsing** ![Bad format](doc/assets/Butlemock-bad-formatting.jpeg);


### Recommedations when using the API

If you are going to consume the API I suggest that you use fetch() instead of your own HTTPS calling implementation, to avoid sending credentials which I don't store, but security reasons try to use it in the way I suggest, just for privacy reasons. **REPEATING, I DO NOT STORE ANY DATA. :)**.


# Example as package/library

[Check here](https://github.com/Devrax/Butlermock-package) :D

# Guide when providing an interface or type to be mocked up

```typescript
const mock = new Interface2Mock(`interface Greeting {
    hello: string;
    cursed: {
        damn: string;
    }[];
  }`); // ❌ Butler mock cannot process direct objects, yet
```

```typescript
const mock = new Interface2Mock(`interface Greeting {
    hello: string;
    cursed: CursedWord[];
  }

  type CursedWord = { damn: string; }`); // ✅ Butler Mock can format this way
```

# FAQs

### **Q: Is it using an AI?**
A: No :)

### Q: How can I tell the API or website to give me a fixed value?
A: You just type explicitly the value you want:
``` typescript
interface ThisIsSparta {
  troops: 300;
  leader: "Leonidas";
  murderedBy: true;
}

interface mightBeSparta {
  troops: 200 | 594 | 2893 | 39;
  leader: "Trump" | "Me" | "You?";
  murderedBy: true; // fixed Booleans can not be multiples values, for that use explicitly 'boolean'
}
```

### Q: Can I copy full code snippet and it will detect the interfaces?
A: Yes :)
![Can I copy full code snippet and it will detect the interfaces?](doc/assets/IlustrationQuestion.png)

# Limitations

This section is for known limitations that Butlermocks has, but in the future might be able to recognize and mock:

|type| casting | description |
|----|---------|-------------|
|Array| Array<string \| boolean \| number \| any>| This casting is not supported, use (string \| boolean \| number \| any)[] instead|
|fixed string | When fixed string includes ";" or ":" |  When providing a fixed string value with a semicolon in it, you must use escape for that semicolon inside the string for correct json representation; Example: `interface Example { fixedString: "I am using a semicolon '\\;' so I used escaping '\\' :)"; }`|

# Status

- [x] *Interfaces*
```typescript
interface NonMockeableInterface {} // ❌ empty interface

interface MockeableInterface {
  somethingToMock: any;
} // ✅ Mockeable

export interface AnotherMockeableInterface {
  anotherThingToMock: any;
} // ✅ Mockeable, 'export' is ignored
```

<br />

- [x] Interfaces with nested interfaces/types
```typescript
type mockeableType = {
  name: string;
} // ✅ Mockeable

interface MockeableInterface {
  somethingToMock: any;
  nestedInterface: AnotherMockeableInterface;
  extraNestedInterface: AnotherMockeableInterface[];
} // ✅ Mockeable

export interface AnotherMockeableInterface {
  anotherThingToMock: any;
} // ✅ Mockeable, 'export' is ignored
```

<br />


- [ ] Interfaces that extends from other interfaces/types
``` typescript
// Not mockeable yet
interface That { ... }

interface This extends That {} // ❌
```

<br />

- [ ] Generic Interfaces
``` typescript
// Not mockeable yet
interface This<T> {
  here: T;
} // ❌
```

<br />

- [ ] Generic Interfaces that extends from other interfaces/types
```Typescript
// Not mockeable yet
interface Evnt<T> {
  name: T;
}

interface IPropertiesToAdd<T> extends Evnt<T> {
  on(): void;
  off(): void;
} // ❌
```

<br />

- [x] Primitive Type
``` typescript
// Not mockeable yet
type justString = string; // ✅ Mockeable
```

<br />

- [x] Type object
``` typescript
type justString = {
  yes: 'you can';
}; // ✅ Mockeable
```

<br />

- [x] Type with nested interfaces/types
``` typescript

type mockeableType = {
  nestedObject: MockeableInterface;
} // ✅ Mockeable

interface MockeableInterface {
  somethingToMock: any;
} // ✅ Mockeable
```

<br />

- [ ] Generic Type
``` typescript
// Not mockeable yet
type IPropertiesToAdd<T extends {}> = T & {
    on(): void
    off(): void
}; // ❌
```