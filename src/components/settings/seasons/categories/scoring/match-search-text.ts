/**
 * A ComboBox filter that also matches other names for an item, such as an
 * award's former names. The input then shows only the item's label.
 */
export function matchSearchText(keywordsByLabel: ReadonlyMap<string, string>) {
  return (textValue: string, inputValue: string) => {
    const query = inputValue.trim().toLowerCase();
    if (query === "") return true;
    const keywords = keywordsByLabel.get(textValue) ?? textValue;
    return keywords.toLowerCase().includes(query);
  };
}
