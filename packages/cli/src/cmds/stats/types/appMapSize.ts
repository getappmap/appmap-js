export type AppMapSize = {
  size: string;
};

export type AppMapSizeTable = {
  [key: string]: AppMapSize;
};

export type SortedAppMapSize = {
  name: string;
  size: number;
};
