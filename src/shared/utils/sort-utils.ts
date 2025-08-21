import { Sort } from '../dtos/general-query.dto';

export const sortFunction = (sort?: Sort) => {
  let sortObject: any = {};

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
  } else {
    // Default sort when no sort parameter is provided or invalid
    sortObject = { createdAt: -1 };
  }

  return sortObject;
};
