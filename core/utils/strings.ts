import { Faker } from "https://esm.sh/@faker-js/faker@8.0.2";

export default class StringPlaceholder {
    private faker: Faker | null = null;
    private reservedString: any = null;

    constructor(faker: Faker) {
        this.faker = faker;
        const fullName = this.faker.person.fullName(),
        firstName = this.faker.person.firstName(),
        middleName = this.faker.person.middleName(),
        lastName = this.faker.person.lastName(),
        address = this.faker.location.streetAddress()

        this.reservedString = {
            name: fullName,
            full_name: fullName,
            fullName: fullName,
            firstName: firstName,
            first_name: firstName,
            middleName: middleName,
            middle_name: middleName,
            lastName: lastName,
            last_name: lastName,
            homepage: this.faker.internet.url(),
            address: address,
            first_address: address,
            primaryAddress: address,
            firstAddress: address,
            location: this.faker.location.country(),
            bio: this.faker.lorem.paragraph(),
            description: this.faker.lorem.paragraph()
        }
    }

    checkStringName(name: string, isArray = false) {
        if(isArray) return new Array(Math.floor(Math.random() * 10)).fill('.').map(_ => this.faker?.lorem.slug());
        if(name.toLowerCase().includes('id')) return this.faker?.string.uuid();
        if(name.toLowerCase().includes('avatar')) return this.faker!.internet.avatar()
        if(name.toLowerCase().includes('url')) return this.faker!.internet.url();
        return this.reservedString[name as keyof typeof this.reservedString];
    }

}