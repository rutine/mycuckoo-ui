export const WRITER_KIND = 'panel-writer';
export const WRITER_STATUS = 'not-implemented';

function getGroupIds(schema) {
  return (schema && Array.isArray(schema.groups) ? schema.groups : []).map((group) => group.id);
}

function createDescriptor(type, element, payload = {}) {
  return {
    kind: type,
    status: WRITER_STATUS,
    notImplemented: true,
    element,
    ...payload
  };
}

export function createFieldWriteDescriptor(element, groupId, fieldId, value) {
  return createDescriptor('panel-write-field', element, {
    groupId,
    fieldId,
    value
  });
}

export function createGroupWriteDescriptor(element, groupId, values = {}) {
  return createDescriptor('panel-write-group', element, {
    groupId,
    values
  });
}

export function createWriter(schema, element) {
  const groupIds = getGroupIds(schema);

  return {
    kind: WRITER_KIND,
    groupIds,
    notImplemented: true,
    describeFieldWrite(groupId, fieldId, value) {
      return createFieldWriteDescriptor(element, groupId, fieldId, value);
    },
    describeGroupWrite(groupId, values = {}) {
      return createGroupWriteDescriptor(element, groupId, values);
    },
    writeField(groupId, fieldId, value) {
      return createFieldWriteDescriptor(element, groupId, fieldId, value);
    },
    writeGroup(groupId, values = {}) {
      return createGroupWriteDescriptor(element, groupId, values);
    }
  };
}

export default createWriter;
