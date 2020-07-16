// Nice grouping pattern, but now need to support both ways :/
// export class Ext {
//     constructor(){
//     }
//     public querySelect?(func: Function): void {}
// }

export class User {
    constructor() {
        this.Lastname = null;
        this.Firstname = null;
        this.Roles = new Array<Roles>();
        this.Department = new Department();
    }
    public Firstname?: string | null;
    public Lastname?: string | null;

    public Roles: Roles[];
    public Department: Department;
}
export class Roles {
    constructor() {
        this.Name = null;
        this.CreatedBy = null;
        this.App = { Active: true, Appname: null };
    }
    public Name?: string | null;
    public CreatedBy?: string | null;

    public App: App;
}
export class App {
    constructor() {
        this.Active = true;
        this.Appname = null;
    }
    public Appname?: string | null;
    public Active?: boolean | null;
}
export class Department {
    constructor() {
        this.Name = null;
        this.Created = null;
    }
    public Name: string | null;
    public Created: string | null;
}


//== This was built using gql-ts

/**User details*/
export interface IUser {
    id: number | null;
    ntUsername: string | null;
    fullname: string | null;
    email: string | null;
    ntDescription: string | null;
    adsCreateDate: string | Date | null;
    deleteMark: number | null;
    badge: string | null;
    phone: string | null;
}
/**User details*/
export class User2 implements IUser {
    constructor() {
        this.id = null;
        this.ntUsername = null;
        this.fullname = null;
        this.email = null;
        this.ntDescription = null;
        this.adsCreateDate = null;
        this.deleteMark = null;
        this.badge = null;
        this.phone = null;
    }
    id: number | null;
    ntUsername: string | null;
    fullname: string | null;
    email: string | null;
    ntDescription: string | null;
    adsCreateDate: string | Date | null;
    deleteMark: number | null;
    badge: string | null;
    phone: string | null;
}
/***/
export interface IUserInfo {
    username: string | null;
    title: string | null;
    bio: string | null;
}
/***/
export class UserInfo implements IUserInfo {
    constructor() {
        this.username = null;
        this.title = null;
        this.bio = null;
    }
    username: string | null;
    title: string | null;
    bio: string | null;
}
/**All things about me*/
export interface IAboutMe {
    userInfo: IUserInfo;
    roles: string[] | null;
    user: IUser;
}
/**All things about me*/
export class AboutMe implements IAboutMe {
    constructor() {
        this.userInfo = new UserInfo();
        this.roles = null;
        this.user = new User2();
    }
    userInfo: IUserInfo;
    roles: string[] | null;
    user: IUser;
}
export class aboutMe extends AboutMe {
    constructor() {
        super();
    }
}
/**All things about API*/
export interface IAboutServer {
    version: string | null;
    versionDate: string | Date | null;
    __type: string;
}
/**All things about API*/
export class AboutServer implements IAboutServer {
    constructor() {
        this.version = null;
        this.versionDate = null;
        this.__type = "aboutServer"
    }
    __type: string;
    version: string | null;
    versionDate: string | Date | null;
}
/**All things about API*/
export class aboutServer extends AboutServer {
    constructor() {
        super();
    }
}
/***/
export interface IGroup {
    id: number | null;
    GroupName: string | null;
    createdBy: string | null;
    createdDate: string | Date | null;
    updatedBy: string | null;
    updatedDate: string | Date | null;
    isDeleted: boolean | null;
    groupMembers: IGroupMember[] | null;
    /**Total count of members*/
    countOfMembers: number | null;
}
/***/
export class Group implements IGroup {
    constructor() {
        this.id = null;
        this.GroupName = null;
        this.createdBy = null;
        this.createdDate = null;
        this.updatedBy = null;
        this.updatedDate = null;
        this.isDeleted = null;
        this.groupMembers = null;
        this.countOfMembers = null;
    }
    id: number | null;
    GroupName: string | null;
    createdBy: string | null;
    createdDate: string | Date | null;
    updatedBy: string | null;
    updatedDate: string | Date | null;
    isDeleted: boolean | null;
    groupMembers: IGroupMember[] | null;
    /**Total count of members*/
    countOfMembers: number | null;
}
/***/
export interface IGroupMember {
    groupId: number | null;
    userName: string | null;
    fullName: string | null;
    email: string | null;
    group: IGroup | null;
}
/***/
export class GroupMember implements IGroupMember {
    constructor() {
        this.groupId = null;
        this.userName = null;
        this.fullName = null;
        this.email = null;
        this.group = null;
    }
    groupId: number | null;
    userName: string | null;
    fullName: string | null;
    email: string | null;
    group: IGroup | null;
}
/**Group Pagination*/
export interface IGroupPagination {
    /**collection of Email Groups*/
    groups: IGroup[] | null;
    /**total records to match search*/
    total: number | null;
    /**total pages based on page size*/
    pageCount: number | null;
}
/**Group Pagination*/
export class GroupPagination implements IGroupPagination {
    constructor() {
        this.groups = null;
        this.total = null;
        this.pageCount = null;
    }
    /**collection of Email Groups*/
    groups: IGroup[] | null;
    /**total records to match search*/
    total: number | null;
    /**total pages based on page size*/
    pageCount: number | null;
}
/**Pagination. [defaults: page = 1, pagesize = 10]*/
export class groupPager extends GroupPagination {
    constructor(page: number | null, pagesize: number | null, search: string | null) {
        super();
    }
}
/**Arguments for the groupPager*/
export class groupPagerArguments {
    constructor() {
        this.page = 1;
        this.pagesize = 25;
        this.search = null;
    }
    page: number | null;
    pagesize: number | null;
    search: string | null;
}

export class group extends Group {
    constructor(groupId: number | null, groupName: string | null, isDeleted: boolean | null, groupTypeId: number | null, groupMember: GroupMember[] | null) {
        super();
    }
}