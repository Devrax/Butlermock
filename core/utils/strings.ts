import { Faker } from "https://esm.sh/@faker-js/faker@8.0.2";

export default class StringPlaceholder {

    constructor(private faker: Faker) {}

    checkStringName(name: string) {
        if(name.toLowerCase().includes('id')) return this.faker.string.uuid();
        if(name.toLowerCase().includes('avatar')) return this.faker.internet.avatar()
        if(name.toLowerCase().includes('url')) return this.faker.internet.url();
        if(name.toLowerCase().includes('image') || name.toLocaleLowerCase().includes('img')) return this.faker.image.url();
        if(name.toLowerCase().includes('email')) return this.faker.internet.email();
        return this.checkReservedString(name.toLocaleLowerCase());
    }

    checkReservedString(name: string) {
        const fullName = this.faker.person.fullName(),
        firstName = this.faker.person.firstName(),
        middleName = this.faker.person.middleName(),
        lastName = this.faker.person.lastName(),
        address = this.faker.location.streetAddress();

        return {
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
            mail: this.faker.internet.email(),
            location: this.faker.location.country(),
            bio: this.faker.lorem.paragraph(),
            description: this.faker.lorem.paragraph()
        }[name]
    }



}