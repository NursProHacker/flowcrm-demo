import type { EntityByType, EntityCollection } from '../types/domain';
import { demoData, type DemoData } from '../data/demo-data';
import { LocalStorageRepository } from './local-storage-repository';
import { EntityService } from './repository';

export type Services = {
  [Collection in EntityCollection]: EntityService<EntityByType[Collection]>;
};

const storageKey = (collection: EntityCollection): string => `flowcrm:demo:${collection}:v1`;

export function createServices(storage?: Storage, initialData: DemoData = demoData): Services {
  const createService = <Collection extends EntityCollection>(collection: Collection) =>
    new EntityService(
      new LocalStorageRepository<EntityByType[Collection]>(
        storageKey(collection),
        initialData[collection],
        storage ?? window.localStorage,
      ),
    );

  return {
    contacts: createService('contacts'),
    deals: createService('deals'),
    tasks: createService('tasks'),
    calendarEvents: createService('calendarEvents'),
    employees: createService('employees'),
    activities: createService('activities'),
    organizations: createService('organizations'),
  };
}

export const services = createServices();
