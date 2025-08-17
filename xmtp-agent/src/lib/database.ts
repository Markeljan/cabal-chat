import { type Group, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export interface CreateGroupData {
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

export type GroupWithMetadata = Group;

export class DatabaseService {
  async createGroup(
    xmtpGroupId: string,
    data: CreateGroupData,
  ): Promise<GroupWithMetadata> {
    console.log(data);
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

  async getGroupByGroupId(groupId: string): Promise<GroupWithMetadata | null> {
    return await prisma.group.findUnique({
      where: { id: groupId },
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
}
