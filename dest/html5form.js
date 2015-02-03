(function( global, factory ) {

  if ( typeof module === "object" && typeof module.exports === "object" ) {
    module.exports = global.document ?
      factory(global, true) :
      function( w ) {
        if ( !w.document ) {
          throw new Error("Requires a window with a document");
        }
        return factory(w);
      };
  } else {
    factory(global);
  }

}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

"use strict";
var ERROR, Field, Form, LIB_CONFIG, PATTERN_KEY, RULE, bindEvent, defaultSettings, elementType, errMsg, getExtremum, hasAttr, isGroupedElement, reset, toNum, validateField;

LIB_CONFIG = {
  name: "H5F",
  version: "0.1.0"
};

PATTERN_KEY = /^\s*\{\{\s*([A-Z_]+)\s*\}\}\s*$/;

RULE = {
  ABSOLUTE_URL: /^.*$/,
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  NUMBER: /^\d+(\.0+)?$/
};

ERROR = {
  COULD_NOT_BE_EMPTY: "Could not be empty.",
  UNKNOWN_INPUT_TYPE: "Unknown input type",
  LENGTH_SMALLER_THAN_MINIMUM: "The length is smaller than {{MINLENGTH}}.",
  LENGTH_BIGGER_THAN_MAXIMUM: "The length is bigger than {{MAXLENGTH}}.",
  INVALID_VALUE: "Invalid value",
  NOT_AN_ABSOLUTE_URL: "Not an absolute URL",
  NOT_AN_EMAIL: "Not an E-mail",
  NOT_A_NUMBER: "Not a number",
  UNDERFLOW: "The number is smaller than {{MIN}}.",
  OVERFLOW: "The number is bigger than {{MAX}}."
};

errMsg = function(MSG, val) {
  var key;
  switch (MSG) {
    case "LENGTH_SMALLER_THAN_MINIMUM":
      key = "MINLENGTH";
      break;
    case "LENGTH_BIGGER_THAN_MAXIMUM":
      key = "MAXLENGTH";
      break;
    case "UNDERFLOW":
      key = "MIN";
      break;
    case "OVERFLOW":
      key = "MAX";
  }
  if (key != null) {
    return ERROR[MSG].replace(new RegExp("\{\{\s*" + key + "\s*\}\}", "g"), val);
  } else {
    return ERROR[MSG];
  }
};

elementType = function(ele) {
  var type, _ref;
  switch (ele.get(0).tagName.toLowerCase()) {
    case "textarea":
      type = "textarea";
      break;
    case "input":
      type = (_ref = ele.attr("type")) != null ? _ref : "text";
  }
  return type;
};

isGroupedElement = function(ele) {
  return $.inArray($(ele).prop("type"), ["radio", "checkbox"]) !== -1;
};

hasAttr = function(ele, attr) {
  return ele.hasAttribute(attr);
};

reset = function() {
  this.valid = true;
  return this.message = "";
};

toNum = function(str) {
  return parseFloat(str);
};

getExtremum = function(ele, type) {
  var val;
  val = $(ele).prop(type);
  if ($.isNumeric(val)) {
    return toNum(val);
  } else {
    return null;
  }
};

Field = (function() {
  function Field(ele) {
    ele = $(ele);
    this.type = elementType(ele);
    this.name = ele.prop("name");
    this.form = ele.closest("form").get(0);
    if (isGroupedElement(ele)) {
      this.element = $.makeArray($("[name='" + this.name + "']", $(this.form)));
      this.required = $("[name='" + this.name + "'][required]", $(this.form)).size() > 0;
    } else {
      this.element = ele.get(0);
      this.required = hasAttr(this.element, "required");
      this.pattern = ele.attr("pattern");
    }
    reset.call(this);
  }

  Field.prototype.value = function() {
    if (isGroupedElement(this.element)) {
      return $("[name='" + this.name + "']:checked", $(this.form)).val();
    } else {
      return $(this.element).val();
    }
  };

  Field.prototype.reset = reset;

  Field.prototype.validate = function() {
    var ele, maxLen, maxVal, minLen, minVal, val, _ref, _ref1, _ref2;
    ele = this.element;
    val = this.value();
    if (this.required && $.trim(val) === "") {
      this.valid = false;
      this.message = errMsg("COULD_NOT_BE_EMPTY");
    } else {
      switch (this.type) {
        case "text":
        case "search":
        case "tel":
        case "url":
        case "email":
        case "password":
        case "textarea":
          minLen = $(ele).prop("minLength");
          maxLen = $(ele).prop("maxLength");
          if (hasAttr(ele, "minlength") && val.length < minLen) {
            this.valid = false;
            this.message = errMsg("LENGTH_SMALLER_THAN_MINIMUM", minLen);
          } else if (hasAttr(ele, "maxlength") && val.length > maxLen) {
            this.valid = false;
            this.message = errMsg("LENGTH_BIGGER_THAN_MAXIMUM", maxLen);
          } else {
            if (this.type === "url") {
              this.valid = RULE.ABSOLUTE_URL.test(val);
              if (!this.valid) {
                this.message = errMsg("NOT_AN_ABSOLUTE_URL");
              }
            } else if (this.type === "email") {
              this.valid = RULE.EMAIL.test(val);
              if (!this.valid) {
                this.message = errMsg("NOT_AN_EMAIL");
              }
            }
            if (this.valid && (this.pattern != null) && this.pattern !== "") {
              this.valid = ((_ref = RULE[(_ref1 = (_ref2 = this.pattern.match(PATTERN_KEY)) != null ? _ref2[1] : void 0) != null ? _ref1 : ""]) != null ? _ref : new RegExp("^" + this.pattern + "$")).test(val);
              if (!this.valid) {
                this.message = errMsg("INVALID_VALUE");
              }
            }
          }
          break;
        case "number":
          this.valid = RULE.NUMBER.test(val);
          if (this.valid) {
            minVal = getExtremum(ele, "min");
            maxVal = getExtremum(ele, "max");
            if ((minVal != null) && toNum(val) < minVal) {
              this.valid = false;
              this.message = errMsg("UNDERFLOW", minVal);
            } else if ((maxVal != null) && toNum(val) > maxVal) {
              this.valid = false;
              this.message = errMsg("OVERFLOW", maxVal);
            }
          } else {
            this.message = errMsg("NOT_A_NUMBER");
          }
          break;
        default:
          this.message = errMsg("UNKNOWN_INPUT_TYPE");
      }
    }
    $($.isArray(ele) ? ele[0] : ele).trigger("H5F:" + (this.valid ? "valid" : "invalid"), this);
    return this.valid;
  };

  return Field;

})();

validateField = function(form, field) {
  field.reset();
  field.validated = true;
  if (field.validate()) {
    if (field.counted === true) {
      form.invalidCount = --form.invalidCount;
    }
    field.counted = false;
  } else {
    if (field.counted !== true) {
      form.invalidCount = ++form.invalidCount;
    }
    field.counted = true;
  }
  return field;
};

bindEvent = function(form, inst, immediate) {
  if (immediate === true) {
    $("[name]:checkbox, [name]:radio", form).on("change", function() {
      return validateField(inst, inst.fields[$(this).prop("name")]);
    });
    $("[name]:not(:checkbox, :radio)", form).on("blur", function() {
      return validateField(inst, inst.fields[$(this).prop("name")]);
    });
  }
  return form.on("submit", function(e) {
    $.each(inst.sequence, function(idx, name) {
      var field;
      field = inst.fields[name];
      if (!immediate) {
        field.validated = false;
      }
      if (field.validated === false) {
        validateField(inst, field);
      }
      return true;
    });
    if (inst.invalidCount > 0) {
      e.preventDefault();
      return e.stopImmediatePropagation();
    }
  });
};

defaultSettings = {
  immediate: false
};

Form = (function() {
  function Form(form) {
    var inst;
    inst = this;
    this.invalidCount = 0;
    $("[name]:not(select, [type='hidden'])", $(form)).each(function() {
      var ipt, name;
      ipt = $(this);
      name = ipt.prop("name");
      return inst.addField(new Field(this));
    });
  }

  Form.prototype.addField = function(field) {
    var name;
    if (this.fields == null) {
      this.fields = {};
    }
    if (this.sequence == null) {
      this.sequence = [];
    }
    name = field.name;
    if (this.fields[name] == null) {
      field.validated = false;
      this.fields[name] = field;
      this.sequence.push(name);
    }
    return field;
  };

  Form.version = LIB_CONFIG.version;

  Form.init = function(forms, settings) {
    var F;
    F = this;
    return $(forms).each(function() {
      var flag, form;
      form = $(this);
      flag = "H5F-inited";
      settings = $.extend({}, defaultSettings, settings, {
        immediate: (function() {
          var attr;
          attr = form.attr("data-h5f-immediate");
          if (attr === "true") {
            attr = true;
          } else if (attr === "false") {
            attr = false;
          } else {
            attr = void 0;
          }
          return attr;
        })()
      });
      if (form.data(flag) !== true) {
        form.data(flag, true);
        form.attr("novalidate", true);
        if (form.attr("data-h5f-novalidate") == null) {
          return bindEvent(form, new F(this), settings.immediate);
        }
      }
    });
  };

  Form.errors = function(msgs) {
    return $.extend(ERROR, msgs);
  };

  Form.rules = function(rules) {
    return $.extend(RULE, rules);
  };

  return Form;

})();

window[LIB_CONFIG.name] = Form;

}));
