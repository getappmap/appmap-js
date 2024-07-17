type ContextContainerMenuItem = {
  // The label to display for the item.
  label: string;

  // The action to perform when the item is clicked.
  action?: () => void;

  // If link is present, the item will be rendered as an a href link.
  link?: string;
};

export default ContextContainerMenuItem;
