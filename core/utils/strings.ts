import type { Faker } from "@faker-js/faker";

/** Splits `userId`, `user_id`, `user-id` and `USER_ID` into lowercase words. */
const words = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());

/**
 * Picks a realistic Faker generator for a string from the property name it is
 * generated for, e.g. `email` -> an email address, `userId` -> a UUID.
 */
export default class StringPlaceholder {
  constructor(private faker: Faker) {}

  checkStringName(name: string): string {
    const lower = name.toLowerCase();
    const nameWords = words(name);
    const hasWord = (...candidates: string[]) =>
      candidates.some((candidate) => nameWords.includes(candidate));

    if (hasWord("id", "uuid", "guid")) return this.faker.string.uuid();
    if (lower.includes("avatar")) return this.faker.image.avatar();
    if (lower.includes("url")) return this.faker.internet.url();
    if (
      lower.includes("image") || lower.includes("img") ||
      lower.includes("thumbnail")
    ) return this.faker.image.url();
    if (lower.includes("email")) return this.faker.internet.email();
    if (lower.includes("phone")) return this.faker.phone.number();
    if (lower.includes("username")) return this.faker.internet.userName();
    if (lower.includes("password")) return this.faker.internet.password();
    return this.checkReservedString(name);
  }

  checkReservedString(name: string): string {
    const faker = this.faker;
    const fullName = () => faker.person.fullName();
    const firstName = () => faker.person.firstName();
    const middleName = () => faker.person.middleName();
    const lastName = () => faker.person.lastName();
    const address = () => faker.location.streetAddress();
    const url = () => faker.internet.url();
    const paragraph = () => faker.lorem.paragraph();
    const zipCode = () => faker.location.zipCode();

    const reservedString: Record<string, () => string> = {
      name: fullName,
      full_name: fullName,
      fullName: fullName,
      firstName: firstName,
      first_name: firstName,
      middleName: middleName,
      middle_name: middleName,
      lastName: lastName,
      last_name: lastName,
      homepage: url,
      website: url,
      address: address,
      first_address: address,
      primaryAddress: address,
      firstAddress: address,
      mail: () => faker.internet.email(),
      location: () => faker.location.country(),
      country: () => faker.location.country(),
      city: () => faker.location.city(),
      zipCode: zipCode,
      zip_code: zipCode,
      postalCode: zipCode,
      postal_code: zipCode,
      company: () => faker.company.name(),
      title: () => faker.lorem.sentence({ min: 2, max: 6 }),
      bio: paragraph,
      description: paragraph,
    };

    return Object.hasOwn(reservedString, name)
      ? reservedString[name]()
      : faker.lorem.slug({ min: 1, max: 5 });
  }
}
