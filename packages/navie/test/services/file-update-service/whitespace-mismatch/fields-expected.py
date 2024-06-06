

    def _bind_to_schema(self, field_name, schema):
        super()._bind_to_schema(field_name, schema)
        new_tuple_fields = []
        for field in self.tuple_fields:
            field = copy.deepcopy(field)
            if hasattr(field, '_bind_to_schema'):
                field._bind_to_schema(field_name, self)
            new_tuple_fields.append(field)
    
        self.tuple_fields = new_tuple_fields

