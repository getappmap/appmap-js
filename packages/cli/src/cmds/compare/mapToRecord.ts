export default function mapToRecord<ValueType>(
  map: Map<string, ValueType>
): Record<string, ValueType> {
  return [...map.entries()].reduce((memo, entry) => {
    const [key, value] = entry;
    memo[key] = value;
    return memo;
  }, {});
}
