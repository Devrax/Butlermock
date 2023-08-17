import { assertThrows } from "https://deno.land/std@0.198.0/assert/mod.ts";
import Interface2Mock from "@core/class/TypeMocker.ts";
import { assertEquals } from "https://deno.land/std@0.198.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.140.0/_util/assert.ts";
import { assertExists } from 'https://deno.land/std@0.198.0/assert/assert_exists.ts';

Deno.test("Providing no interface", () => {
  assertThrows(() => new Interface2Mock(''), Error, 'No interfaces or types were found');
});

Deno.test("Providing single interface", () => {
  const mock = new Interface2Mock(`interface Greeting {
    hello: string;
  }`);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: { hello: 'world' }}));

  const specificObjMocked = mock.buildMock('Greeting');
  assertEquals(Object.keys(specificObjMocked), Object.keys({ hello: 'world' }));

  const noSpecificObjMocked = mock.buildMock('');
  assertEquals(Object.keys(noSpecificObjMocked), Object.keys({ Greeting: { hello: 'world' }}));
});

Deno.test("Providing two interfaces", () => {
  const mock = new Interface2Mock(`
  interface Greeting {
    hello: string;
  }

  interface CursedWord {
    damn: string;
  }
  `);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: null, CursedWord: null }));

  const specificObjGreetingMocked = mock.buildMock('Greeting');
  assertEquals(Object.keys(specificObjGreetingMocked), Object.keys({ hello: 'world' }));

  const specificObjCursedMocked = mock.buildMock('CursedWord');
  assertEquals(Object.keys(specificObjCursedMocked), Object.keys({ damn: 'f*ck' }));

  const noSpecificObjMocked = mock.buildMock('');
  assertEquals(Object.keys(noSpecificObjMocked), Object.keys({ Greeting: null, CursedWord: null}));
});

Deno.test("Providing two interfaces - 2", () => {
  const mock = new Interface2Mock(`interface FoundationContact {
    type: 'tel' | string;
    displayValue: string;
    value: string;
    urlScheme: 'tel';
  }
  
  export interface FoundationInformation {
    id: string;
    title: string;
    hasRNC?: boolean;
    contacts: FoundationContact[];
    receivings: string[];
    description: string;
    location: string;
  }`);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ FoundationContact: null, FoundationInformation: null }));
  assertExists(mock.buildMock('FoundationContact'));
  assertExists(mock.buildMock('FoundationInformation'));
  assert(Array.isArray(mock.buildMock('FoundationInformation').contacts));
  assertEquals(mock.buildMock('FoundationContact').urlScheme, 'tel');
});

Deno.test("Providing three interfaces with one duplication", () => {
  const mock = new Interface2Mock(`interface FoundationContact {
    type: 'tel' | string;
    displayValue: string;
    value: string;
    urlScheme: 'tel';
  }

  export interface FoundationInformation {
    id: string;
    title: string;
    hasRNC?: boolean;
    contacts: FoundationContact[];
    receivings: string[];
    description: string;
    location: string;
  }
  
  export interface FoundationInformation {
    id: string;
    title: string;
    hasRNC?: boolean;
    contacts: FoundationContact[];
    receivings: string[];
    description: string;
    location: string;
  }`);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ FoundationContact: null, FoundationInformation: null }));
});

Deno.test("Providing nested Interface", () => {
  const mock = new Interface2Mock(`
  interface Greeting {
    hello: string;
    cursed: CursedWord;
  }

  interface CursedWord {
    damn: string;
  }
  `);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: null, CursedWord: null }));

  const specificObjGreetingMocked = mock.buildMock('Greeting') as unknown as { hello: string, cursed: { damn: string}};
  assertEquals(Object.keys(specificObjGreetingMocked), Object.keys({ hello: null, cursed: null }));
  assertEquals(Object.keys(specificObjGreetingMocked.cursed), Object.keys({ damn: null }));
});

Deno.test("Providing nested unknown Interface", () => {
  const mock = new Interface2Mock(`
  interface Greeting {
    hello: string;
    cursed: CursedWord;
  }`);

  const objMocked = mock.buildMock() as unknown as { Greeting: { hello: string, cursed: string } };
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: { hello: null, cursed: null } }));
  assertEquals(objMocked.Greeting.cursed, null);
});

Deno.test("Providing single Type", () => {
  const mock = new Interface2Mock(`type Greeting = {
    hello: string;
  }`);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: { hello: 'world' }}));

  const specificObjMocked = mock.buildMock('Greeting');
  assertEquals(Object.keys(specificObjMocked), Object.keys({ hello: 'world' }));

  const noSpecificObjMocked = mock.buildMock('');
  assertEquals(Object.keys(noSpecificObjMocked), Object.keys({ Greeting: { hello: 'world' }}));
});

Deno.test("Providing two Type", () => {
  const mock = new Interface2Mock(`type Greeting = {
    hello: string;
  }

  type CursedWord = {
    damn: string;
  }`);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: null, CursedWord: null }));

  const specificObjGreetingMocked = mock.buildMock('Greeting');
  assertEquals(Object.keys(specificObjGreetingMocked), Object.keys({ hello: 'world' }));

  const specificObjCursedMocked = mock.buildMock('CursedWord');
  assertEquals(Object.keys(specificObjCursedMocked), Object.keys({ damn: 'f*ck' }));

  const noSpecificObjMocked = mock.buildMock('');
  assertEquals(Object.keys(noSpecificObjMocked), Object.keys({ Greeting: null, CursedWord: null}));
});

Deno.test("Providing nested Type", () => {
  const mock = new Interface2Mock(`type Greeting = {
    hello: string;
    cursed: CursedWord;
  }

  type CursedWord = {
    damn: string;
  }`);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: null, CursedWord: null }));

  const specificObjGreetingMocked = mock.buildMock('Greeting') as unknown as { hello: string, cursed: { damn: string}};
  assertEquals(Object.keys(specificObjGreetingMocked), Object.keys({ hello: null, cursed: null }));
  assertEquals(Object.keys(specificObjGreetingMocked.cursed), Object.keys({ damn: null }));
});

Deno.test("Providing nested unknown Type", () => {
  const mock = new Interface2Mock(`type Greeting = {
    hello: string;
    cursed: CursedWord;
  }`);

  const objMocked = mock.buildMock() as unknown as { Greeting: { hello: string, cursed: string } };
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: { hello: null, cursed: null } }));
  assertEquals(objMocked.Greeting.cursed, null);
});

Deno.test("Providing a type and an interface", () => {
  const mock = new Interface2Mock(`type Greeting = {
    hello: string;
  }

  interface CursedWord {
    damn: string;
  }
  `);

  const objMocked = mock.buildMock() as unknown as { Greeting: { hello: string }, CursedWord: { damn: string} };
  assertEquals(Object.keys(objMocked), Object.keys({ CursedWord: null, Greeting: null }));
  assertEquals(Object.keys(objMocked.Greeting), Object.keys({ hello: 'hi' }));
  assertEquals(Object.keys(objMocked.CursedWord), Object.keys({ damn: 'f*ck' }));
});

Deno.test("Providing a nested type in an interface", () => {
  const mock = new Interface2Mock(`interface Greeting {
    hello: string;
    cursed: CursedWord;
  }

  type CursedWord = {
    damn: string;
  }
  `);

  const objMocked = mock.buildMock();
  assertEquals(Object.keys(objMocked), Object.keys({ Greeting: null, CursedWord: null }));

  const specificObjGreetingMocked = mock.buildMock('Greeting') as unknown as { hello: string, cursed: { damn: string}};
  assertEquals(Object.keys(specificObjGreetingMocked), Object.keys({ hello: null, cursed: null }));
  assertEquals(Object.keys(specificObjGreetingMocked.cursed), Object.keys({ damn: null }));
});

Deno.test("Providing a nested array type in an interface", () => {
  const mock = new Interface2Mock(`interface Greeting {
    hello: string;
    cursed: CursedWord[];
  }

  type CursedWord = {
    damn: string;
  }
  `);

  const objMocked = mock.buildMock('Greeting') as unknown as { hello: string, cursed: { damn: string}[]};
  assert(objMocked.cursed.length >= 0);
});
