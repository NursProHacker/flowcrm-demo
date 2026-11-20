import type { Repository } from './repository';

export class LocalStorageRepository<TEntity extends { id: string }>
  implements Repository<TEntity>
{
  constructor(
    private readonly storageKey: string,
    private readonly initialData: readonly TEntity[] = [],
    private readonly storage: Storage = window.localStorage,
  ) {}

  async getAll(): Promise<TEntity[]> {
    const serialized = this.storage.getItem(this.storageKey);

    if (serialized === null) {
      return [...this.initialData];
    }

    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      throw new Error(`Повреждены данные в хранилище «${this.storageKey}».`);
    }

    return parsed as TEntity[];
  }

  async getById(id: string): Promise<TEntity | null> {
    const entities = await this.getAll();
    return entities.find((entity) => entity.id === id) ?? null;
  }

  async create(entity: TEntity): Promise<TEntity> {
    const entities = await this.getAll();
    if (entities.some((existing) => existing.id === entity.id)) {
      throw new Error(`Запись с идентификатором «${entity.id}» уже существует.`);
    }

    this.save([...entities, entity]);
    return entity;
  }

  async update(id: string, changes: Partial<Omit<TEntity, 'id'>>): Promise<TEntity> {
    const entities = await this.getAll();
    const entityIndex = entities.findIndex((entity) => entity.id === id);
    const entity = entities[entityIndex];

    if (entityIndex === -1 || !entity) {
      throw new Error(`Запись с идентификатором «${id}» не найдена.`);
    }

    const updatedEntity = { ...entity, ...changes, id };
    entities[entityIndex] = updatedEntity;
    this.save(entities);
    return updatedEntity;
  }

  async delete(id: string): Promise<void> {
    const entities = await this.getAll();
    this.save(entities.filter((entity) => entity.id !== id));
  }

  async reset(): Promise<void> {
    this.save([...this.initialData]);
  }

  private save(entities: readonly TEntity[]): void {
    this.storage.setItem(this.storageKey, JSON.stringify(entities));
  }
}
