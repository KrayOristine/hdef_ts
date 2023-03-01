
-- This file contain all the function that can't coded in ts but only pure lua

return function loopList(start, finish, backward)
    local head = start.head
    if head.count == 0 then
        return
    end
    local direction = backward and "prev" or "next"
    local skip = start ~= head or start == finish
    if not finish or finish == head then
        return function()
            if skip then
                skip = false
            else
                start = start[direction]
            end
            return start ~= head and start or nil
        end
    else
        return function()
            if start ~= finish or skip then
                if skip and skip ~= 1 then
                    skip = start == finish and 1
                else
                    start = start[direction]
                    if start == head then
                        start = start[direction]
                    end
                end
                return start
            end
        end
    end
end