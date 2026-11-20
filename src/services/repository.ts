export interface Repository<TEntity extends { id: string }> {
  getAll(): Promise<TEntity[]>;
  getById(id: string): Promise<TEntity | null>;
  create(entity: TEntity): Promise<TEntity>;
  update(id: string, changes: Partial<Omit<TEntity, 'id'>>): Promise<TEntity>;
  delete(id: string): Promise<void>;
  reset(): Promise<void>;
}

export class EntityService<TEntity extends { id: string }> {
  constructor(private readonly repository: Repository<TEntity>) {}

  getAll(): Promise<TEntity[]> {
    return this.repository.getAll();
  }

  getById(id: string): Promise<TEntity | null> {
    return this.repository.getById(id);
  }

  create(entity: TEntity): Promise<TEntity> {
    return this.repository.create(entity);
  }

  update(id: string, changes: Partial<Omit<TEntity, 'id'>>): Promise<TEntity> {
    return this.repository.update(id, changes);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  reset(): Promise<void> {
    return this.repository.reset();
  }
}
