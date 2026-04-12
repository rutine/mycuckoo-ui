function updateTitle(element, title) {
  if (!element || element.title === title) {
    return;
  }

  element.title = title;
}

function updateText(element, text) {
  if (!element || element.textContent === text) {
    return;
  }

  element.textContent = text;
}

function localizeListEntry(container, translate) {
  container.querySelectorAll('.bio-properties-panel-list-entry .bio-properties-panel-add-entry')
    .forEach((button) => {
      updateTitle(button, translate('Create new list item'));

      const label = button.querySelector('.bio-properties-panel-add-entry-label');
      updateText(label, translate('Create'));
    });

  container.querySelectorAll('.bio-properties-panel-list-entry .bio-properties-panel-arrow')
    .forEach((button) => {
      updateTitle(button, translate('Toggle list item'));
    });

  container.querySelectorAll('.bio-properties-panel-remove-list-entry')
    .forEach((button) => {
      updateTitle(button, translate('Delete item'));
    });

  container.querySelectorAll('.bio-properties-panel-list-entry .bio-properties-panel-list-badge')
    .forEach((badge) => {
      const count = Number((badge.textContent || '').trim());

      if (Number.isNaN(count)) {
        return;
      }

      updateTitle(
        badge,
        translate(`List contains {numOfItems} item${count === 1 ? '' : 's'}`, { numOfItems: count })
      );
    });
}

function localizeDataMarker(container, translate) {
  container.querySelectorAll('.bio-properties-panel-dot')
    .forEach((marker) => {
      const title = marker.classList.contains('bio-properties-panel-dot--error')
        ? translate('Section contains an error')
        : translate('Section contains data');

      updateTitle(marker, title);
    });
}

function localizeGroupHeader(container, translate) {
  container.querySelectorAll('.bio-properties-panel-group-header .bio-properties-panel-arrow')
    .forEach((button) => {
      updateTitle(button, translate('Toggle section'));
    });
}

function localizePropertiesPanel(container, translate) {
  if (!container) {
    return;
  }

  localizeListEntry(container, translate);
  localizeDataMarker(container, translate);
  localizeGroupHeader(container, translate);
}

function PropertiesPanelI18n(propertiesPanel, eventBus, translate) {
  const container = propertiesPanel && propertiesPanel._container;

  if (!container || typeof MutationObserver === 'undefined') {
    return;
  }

  let scheduled = false;

  function scheduleLocalize() {
    if (scheduled) {
      return;
    }

    scheduled = true;

    Promise.resolve().then(() => {
      scheduled = false;
      localizePropertiesPanel(container, translate);
    });
  }

  const observer = new MutationObserver(() => {
    scheduleLocalize();
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });

  eventBus.on('selection.changed', scheduleLocalize);
  eventBus.on('elements.changed', scheduleLocalize);
  eventBus.on('propertiesPanel.providersChanged', scheduleLocalize);

  scheduleLocalize();
}

PropertiesPanelI18n.$inject = [ 'propertiesPanel', 'eventBus', 'translate' ];

export default {
  __init__: [ 'propertiesPanelI18n' ],
  propertiesPanelI18n: [ 'type', PropertiesPanelI18n ]
};
