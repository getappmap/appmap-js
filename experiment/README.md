Model: Claude Sonnet 4

```console
$ pushd maps
$ appmap sequence-diagram --format plantuml *.appmap.json
$ appmap sequence-diagram --format text *.appmap.json
$ popd
$ for f in maps/*; do echo $f; appmap navie -c $f "/nocontext /nogather Tell me about this appmap. Is there anything of particular note?" | tee responses/`basename $f`.response.md; done
```
