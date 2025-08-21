import { type Group, PrismaClient, type User } from "@prisma/client";

export const prisma = new PrismaClient();

export interface CreateGroupData {
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  metadata?: Record<string, string>;
}

export type GroupWithMetadata = Group;

export class DatabaseService {
  async createGroup(
    xmtpGroupId: string,
    data: CreateGroupData,
  ): Promise<GroupWithMetadata> {
    console.log(data);

    // Ensure the user exists before creating the group
    await prisma.user.upsert({
      where: { address: data.createdBy },
      update: {}, // Don't update anything if user exists
      create: {
        address: data.createdBy,
        username: null,
        avatarUrl: null,
      },
    });

    return await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        groupId: xmtpGroupId,
        createdBy: data.createdBy,
        metadata: data.metadata,
      },
    });
  }

  async getGroupById(id: string): Promise<GroupWithMetadata | null> {
    return await prisma.group.findUnique({
      where: { id },
    });
  }

  async getGroupsByCreator(createdBy: string): Promise<GroupWithMetadata[]> {
    return await prisma.group.findMany({
      where: { createdBy },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateGroup(
    id: string,
    data: Partial<CreateGroupData>,
  ): Promise<GroupWithMetadata> {
    return await prisma.group.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteGroup(id: string): Promise<void> {
    await prisma.group.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAllActiveGroups(): Promise<GroupWithMetadata[]> {
    return await prisma.group.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async addGroupMember(groupId: string, address: string): Promise<void> {
    // Ensure the user exists before adding them as a group member
    await prisma.user.upsert({
      where: { address },
      update: {},
      create: {
        address,
        username: null,
        avatarUrl: null,
      },
    });

    // Connect user to the group via many-to-many relation
    await prisma.group.update({
      where: { groupId },
      data: {
        members: {
          connect: { address },
        },
      },
    });
  }

  async removeGroupMember(groupId: string, address: string): Promise<void> {
    await prisma.group.update({
      where: { groupId },
      data: {
        members: {
          disconnect: { address },
        },
      },
    });
  }

  async getGroupMember(groupId: string, address: string): Promise<boolean> {
    const result = await prisma.group.findUnique({
      where: { groupId },
      select: {
        members: {
          where: { address },
          select: { address: true },
          take: 1,
        },
      },
    });
    return (result?.members.length || 0) > 0;
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    const group = await prisma.group.findUnique({
      where: { groupId },
      select: {
        members: true,
      },
    });
    return group?.members ?? [];
  }

  async getUserJoinedGroups(address: string): Promise<GroupWithMetadata[]> {
    const userWithGroups = await prisma.user.findUnique({
      where: { address },
      select: {
        groups: {
          where: { isActive: true },
        },
      },
    });
    return userWithGroups?.groups ?? [];
  }
}
