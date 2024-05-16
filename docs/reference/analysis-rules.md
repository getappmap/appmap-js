---
layout: docs
title: Docs - Reference
description: "Explore detailed rules reference for AppMap analysis, including impact, scope, labels, and references."
name: Analysis Rules
step: 14
reference: true
---

# Rules Reference
<ul class="toc">
{% for analysis_rule in site.analysis_rules %}
  <li>
    <a href="#{{ analysis_rule.rule }}">{{analysis_rule.name }}</a>
  </li>
{% endfor %}
</ul>

<ul class="analysis-doc-list">
{% for analysis_rule in site.analysis_rules %}
  <li class="analysis-rule" id="{{ analysis_rule.rule }}">
    <h2>
      {{ analysis_rule.name }}
    </h2>

    <div class="analysis-metrics">
      <ul>
        <li class="name">Id</li>
        <li class="value">{{ analysis_rule.rule }}</li>
      </ul>
      <ul>
        <li class="name">Impact Domain</li>
        <li class="value">{{ analysis_rule.impactDomain }}</li>
      </ul>
      <ul>
        <li class="name">Scope</li>
        <li class="value">{{ analysis_rule.scope }}</li>
      </ul>
      <ul>
        <li class="name">Labels</li>
        <li class="value">
          {% for label in analysis_rule.labels %}
            <a href="./analysis-rules.html#{{ label }}">{{ label }}</a>
            <br/>
          {% endfor %}
        </li>
      </ul>
      <ul>
        <li class="name">References</li>
        <li class="value">
          {% for reference in analysis_rule.references %}
            <a href="{{ reference[1] }}" target="_blank">{{ reference[0] }}</a>
          {% endfor %}
        </li>
      </ul>
    </div>
    {{ analysis_rule.content | markdownify }}
  </li>
  <hr/>
{% endfor %}
</ul>
