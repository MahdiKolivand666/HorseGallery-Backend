import { Sort } from '../dtos/general-query.dto';

export const sortFunction = (sort?: Sort): Record<string, 1 | -1> => {
  let sortObject: Record<string, 1 | -1> = { createdAt: -1 };

  if (sort === Sort.Title) {
    sortObject = { title: 1 };
  } else if (sort === Sort.UpdatedAt) {
    sortObject = { updatedAt: -1 };
  } else if (sort === Sort.LastName) {
    sortObject = { lastName: 1 };
  } else if (sort === Sort.Cheap) {
    sortObject = { price: 1 };
  } else if (sort === Sort.Expensive) {
    sortObject = { price: -1 };
  }

  return sortObject;
};
