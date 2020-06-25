export interface Schema
{
    queryType: TypeElement;
    mutationType: TypeElement;
    subscriptionType: SubscriptionType;
    types: TypeElement[];
    directives: directives[];
}
export interface SubscriptionType
{
    name: string;
}
export interface Field
{
    name: string;
    description: string;
    args: InputValue[];
    type: TypeElement;
    isdeprecated: boolean;
    deprecationReason: string;
}
export interface InputValue
{
    name: string;
    description: string;
    type: TypeElement;
    defaultValue: string;
}
export interface directives
{
    name: string;
    description: string;
    locations: string[];
    args: InputValue[];
}
export interface EnumValue
{
    name: string;
    description: string;
    isdeprecated: boolean;
    deprecationReason: string;
}
export interface TypeElement
{
    kind: string;
    name: string;
    description: string;
    inputFields: InputValue[];
    fields: Field[];
    interfaces: TypeElement[];
    enumValues: EnumValue[];
    possibleTypes: TypeElement[];
    ofType: TypeElement;
}
