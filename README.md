# Butlermock

[![Made with Fresh](https://fresh.deno.dev/fresh-badge-dark.svg)](https://fresh.deno.dev)

A website/API that builds mocks from typescript's types/interfaces into object
with actual data using Fakerjs

# Usage

```typescript
import Interface2Mock from "@core/class/TypeMocker.ts";

const mock = new Interface2Mock(`interface GithubUser {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	name: string;
	company?: any;
	blog: string;
	location: string;
	email?: any;
	hireable: boolean;
	bio: string;
	twitter_username?: any;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: Date;
	updated_at: Date;
}`);

console.log(mock.buildMock());
/*
{
  GithubUser: {
    login: "deserunt-voluptatum-ipsa",
    id: 2282223950626816,
    node_id: "2dc8a6d1-1ab9-483e-9862-d441777c7ee7",
    avatar_url: "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/265.jpg",
    gravatar_id: "34c631dd-5702-4c62-a11e-80df124cf993",
    url: "https://adorable-decryption.com/",
    html_url: "https://daring-wifi.biz/",
    followers_url: "https://pushy-beast.name/",
    following_url: "https://bright-tusk.biz",
    gists_url: "https://ill-fated-external.net",
    starred_url: "https://yellow-fahrenheit.name",
    subscriptions_url: "https://familiar-name.info/",
    organizations_url: "https://wrong-painting.net/",
    repos_url: "https://fabulous-scraper.net/",
    events_url: "https://complicated-tradition.com",
    received_events_url: "https://front-soul.info/",
    type: "natus-repudiandae",
    site_admin: false,
    name: "Ramona Kilback",
    company: null,
    blog: "ratione-consequatur",
    location: "amet-officiis-tempora",
    email: null,
    hireable: false,
    bio: "",
    twitter_username: null,
    public_repos: 7861263249965056,
    public_gists: 2788398970437632,
    followers: 2588651141726208,
    following: 7024883036848128,
    created_at: 2022-08-31T06:03:04.388Z,
    updated_at: 2023-03-11T17:52:55.215Z
  }
}
*/

console.log(mock.buildMock("GithubUser"));
/*
{
    login: "deserunt-voluptatum-ipsa",
    id: 2282223950626816,
    node_id: "2dc8a6d1-1ab9-483e-9862-d441777c7ee7",
    avatar_url: "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/265.jpg",
    gravatar_id: "34c631dd-5702-4c62-a11e-80df124cf993",
    url: "https://adorable-decryption.com/",
    html_url: "https://daring-wifi.biz/",
    followers_url: "https://pushy-beast.name/",
    following_url: "https://bright-tusk.biz",
    gists_url: "https://ill-fated-external.net",
    starred_url: "https://yellow-fahrenheit.name",
    subscriptions_url: "https://familiar-name.info/",
    organizations_url: "https://wrong-painting.net/",
    repos_url: "https://fabulous-scraper.net/",
    events_url: "https://complicated-tradition.com",
    received_events_url: "https://front-soul.info/",
    type: "natus-repudiandae",
    site_admin: false,
    name: "Ramona Kilback",
    company: null,
    blog: "ratione-consequatur",
    location: "amet-officiis-tempora",
    email: null,
    hireable: false,
    bio: "",
    twitter_username: null,
    public_repos: 7861263249965056,
    public_gists: 2788398970437632,
    followers: 2588651141726208,
    following: 7024883036848128,
    created_at: 2022-08-31T06:03:04.388Z,
    updated_at: 2023-03-11T17:52:55.215Z
}
*/
```

You also can have multiple interface and/or type

```typescript
const test = new Interface2Mock(`interface simpleObject {
    iAmSimple: boolean;
  }

  type notSimpleObject = {
    iCanBeSimple: dontCare;
  }

  type dontCare = {
    doICare: boolean;
  }`);

console.log(test.buildMock());
/*
{
  simpleObject: { iAmSimple: true },
  notSimpleObject: { iCanBeSimple: { doICare: false } },
  dontCare: { doICare: true }
}
*/

console.log(test.buildMock("simpleObject")); // { iAmSimple: true }
```

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

# Status

- [x] Interfaces
- [x] Interfaces with nested interfaces/types
- [ ] Interfaces that extends from other interfaces/types
- [ ] Generic Interfaces
- [ ] Generic Interfaces that extends from other interfaces/types
- [ ] Primitive Type
- [x] Type object
- [x] Type with nested interfaces/types
- [ ] Generic Type