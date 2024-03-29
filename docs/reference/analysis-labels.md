---
layout: docs
title: Docs - Reference
description: "Explore technical documentation for analysis labels with AppMap."
name: Analysis Labels
step: 14
reference: true
redirect_from: [/docs/analysis/labels-reference]
---

# Label Reference
<ul class="toc">
{% for analysis_label in site.analysis_labels %}
  <li>
    <a href="#{{ analysis_label.name }}">{{analysis_label.name }}</a>
  </li>
{% endfor %}
</ul>


<ul class="analysis-doc-list label">
  {% for analysis_label in site.analysis_labels %}
    <li class="analysis-label" id="{{ analysis_label.name }}">
      <h2>
        {{ analysis_label.name }}
      </h2>

      <div class="analysis-metrics">
        <ul>
          <li class="name">Rules</li>
          <li class="value">
            {% for rule in analysis_label.rules %}
              <a href="./analysis-rules.html#{{rule}}">
                {{ rule }}
              </a>
              <br/>
            {% endfor %}
          </li>
        </ul>
      </div>

      {{ analysis_label.content | markdownify }}
    </li>
    <hr/>
{% endfor %}
</ul>  



